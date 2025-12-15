import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/src/constants/theme";
import { userService } from "@/src/services/user.service";
import { studentService } from "@/src/services/student.service";
import { driverService } from "@/src/services/driver.service";
import {
  showErrorAlert,
  showSuccessAlert,
  showDestructiveConfirm,
  showWarningConfirm,
} from "@/src/utils/alerts";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  role: "passenger" | "driver" | "admin";
  status: "active" | "inactive" | "banned";
  createdAt: string;
  metadata?: {
    phone?: string;
    address?: string;
  };
  driverProfile?: {
    username: string;
    contactNumber: string;
    age: number;
    address: string;
    isVerified: boolean;
  };
  studentProfile?: {
    studentId: string;
    course?: string;
    yearLevel?: string;
    emergencyContactName?: string;
    emergencyContactNumber?: string;
    isVerified: boolean;
  };
}

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<"all" | "passenger" | "driver" | "admin">("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      // Fetch users and their profile data separately
      const [usersResponse, studentsResponse, driversResponse] = await Promise.all([
        userService.getUsers({
          limit: 100,
          sort: "createdAt",
          order: "desc",
          fields: "id,firstName,lastName,middleName,email,role,status,createdAt,metadata",
        }),
        studentService.getStudents({
          limit: 100,
          fields:
            "id,userId,studentId,course,yearLevel,emergencyContactName,emergencyContactNumber,isVerified",
        }),
        driverService.getDrivers({
          limit: 100,
          fields: "id,userId,username,contactNumber,age,address,isVerified",
        }),
      ]);

      if (usersResponse.success && studentsResponse.success && driversResponse.success) {
        const users = usersResponse.data || [];
        const students = studentsResponse.data || [];
        const drivers = driversResponse.data || [];

        // Create lookup maps for profiles
        const studentMap = new Map(students.map((student) => [student.userId, student]));
        const driverMap = new Map(drivers.map((driver) => [driver.userId, driver]));

        // Merge profile data with user data
        const usersWithProfiles = users.map((user) => ({
          ...user,
          studentProfile: user.role === "passenger" ? studentMap.get(user.id) : undefined,
          driverProfile: user.role === "driver" ? driverMap.get(user.id) : undefined,
        }));

        setUsers(usersWithProfiles);
        setFilteredUsers(usersWithProfiles);
      } else {
        console.error("API Errors:", {
          users: usersResponse.success,
          students: studentsResponse.success,
          drivers: driversResponse.success,
        });
        showErrorAlert(
          "Loading Error",
          "Failed to load users data. Please check your connection and try again."
        );
      }
    } catch (error) {
      console.error("Error loading users:", error);
      showErrorAlert(
        "Network Error",
        "Failed to load users. Please check your internet connection."
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (user) =>
          user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by role
    if (selectedRole !== "all") {
      filtered = filtered.filter((user) => user.role === selectedRole);
    }

    setFilteredUsers(filtered);
  };

  const confirmUserStatusChange = (
    userId: string,
    newStatus: "active" | "inactive" | "banned",
    userName: string
  ) => {
    const statusActions = {
      active: {
        title: "Activate User Account",
        message: `Are you sure you want to activate ${userName}'s account? They will be able to use the app normally.`,
        confirmText: "Activate",
      },
      inactive: {
        title: "Deactivate User Account",
        message: `Are you sure you want to deactivate ${userName}'s account? They will not be able to log in until reactivated.`,
        confirmText: "Deactivate",
      },
      banned: {
        title: "Ban User Account",
        message: `Are you sure you want to ban ${userName}'s account? This is a serious action that should only be taken for policy violations.`,
        confirmText: "Ban User",
      },
    };

    const action = statusActions[newStatus];

    if (newStatus === "banned") {
      showDestructiveConfirm(
        action.title,
        action.message,
        () => handleUserStatusChange(userId, newStatus),
        undefined,
        action.confirmText
      );
    } else {
      showWarningConfirm(
        action.title,
        action.message,
        () => handleUserStatusChange(userId, newStatus),
        undefined,
        action.confirmText
      );
    }
  };

  const handleUserStatusChange = async (
    userId: string,
    newStatus: "active" | "inactive" | "banned"
  ) => {
    try {
      const response = await userService.updateUser(userId, { status: newStatus });

      if (response.success) {
        setUsers((prev) =>
          prev.map((user) => (user.id === userId ? { ...user, status: newStatus } : user))
        );

        const statusMessages = {
          active: "User account has been activated successfully",
          inactive: "User account has been deactivated successfully",
          banned: "User account has been banned successfully",
        };

        showSuccessAlert("Status Updated", statusMessages[newStatus]);
        setShowUserModal(false);
      } else {
        showErrorAlert("Update Failed", response.message || "Failed to update user status");
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      showErrorAlert("Update Error", "Failed to update user status. Please try again.");
    }
  };

  const confirmDeleteUser = (userId: string, userName: string) => {
    showDestructiveConfirm(
      "Delete User Account",
      `Are you sure you want to permanently delete ${userName}'s account? This action cannot be undone and will remove all their data including ride history, ratings, and profile information.`,
      () => handleDeleteUser(userId),
      undefined,
      "Delete Permanently"
    );
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await userService.deleteUser(userId);

      if (response.success) {
        setUsers((prev) => prev.filter((user) => user.id !== userId));
        showSuccessAlert("User Deleted", "User account has been permanently deleted");
        setShowUserModal(false);
      } else {
        showErrorAlert("Deletion Failed", response.message || "Failed to delete user account");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      showErrorAlert("Deletion Error", "Failed to delete user account. Please try again.");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, selectedRole, users]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "#EF4444";
      case "driver":
        return "#F59E0B";
      case "passenger":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#10B981";
      case "inactive":
        return "#F59E0B";
      case "banned":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const UserCard = ({ user }: { user: User }) => {
    const getProfileInfo = () => {
      if (user.role === "driver" && user.driverProfile) {
        return {
          primaryInfo: `@${user.driverProfile.username}`,
          secondaryInfo: `Age: ${user.driverProfile.age} • ${user.driverProfile.contactNumber}`,
          verified: user.driverProfile.isVerified,
        };
      } else if (user.role === "passenger" && user.studentProfile) {
        return {
          primaryInfo: `ID: ${user.studentProfile.studentId}`,
          secondaryInfo: user.studentProfile.course
            ? `${user.studentProfile.course} - Year ${user.studentProfile.yearLevel || "N/A"}`
            : `Year ${user.studentProfile.yearLevel || "N/A"}`,
          verified: user.studentProfile.isVerified,
        };
      }
      return null;
    };

    const profileInfo = getProfileInfo();

    return (
      <TouchableOpacity
        className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
        onPress={() => {
          setSelectedUser(user);
          setShowUserModal(true);
        }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="text-lg font-semibold text-gray-900">
                {user.firstName} {user.middleName ? `${user.middleName} ` : ""}
                {user.lastName}
              </Text>
              {profileInfo?.verified && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color="#10B981"
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
            <Text className="text-gray-600 text-sm mb-1">{user.email}</Text>
            {profileInfo && (
              <>
                <Text className="text-gray-700 text-sm font-medium">{profileInfo.primaryInfo}</Text>
                <Text className="text-gray-500 text-xs">{profileInfo.secondaryInfo}</Text>
              </>
            )}
          </View>
          <View className="items-end">
            <View
              className="px-2 py-1 rounded-full mb-1"
              style={{ backgroundColor: getRoleColor(user.role) + "20" }}
            >
              <Text
                className="text-xs font-medium capitalize"
                style={{ color: getRoleColor(user.role) }}
              >
                {user.role === "passenger" ? "student" : user.role}
              </Text>
            </View>
            <View
              className="px-2 py-1 rounded-full"
              style={{ backgroundColor: getStatusColor(user.status) + "20" }}
            >
              <Text
                className="text-xs font-medium capitalize"
                style={{ color: getStatusColor(user.status) }}
              >
                {user.status}
              </Text>
            </View>
          </View>
        </View>
        <Text className="text-xs text-gray-500">
          Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900 mb-4">User Management</Text>

        {/* Search Bar */}
        <View className="relative mb-4">
          <TextInput
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg bg-gray-50"
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Ionicons
            name="search"
            size={20}
            color={Colors.light.tabIconDefault}
            style={{ position: "absolute", left: 12, top: 12 }}
          />
        </View>

        {/* Role Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 0 }}
          className="mb-2"
        >
          <View className="flex-row space-x-3 px-0 gap-3">
            {["all", "passenger", "driver", "admin"].map((role) => (
              <TouchableOpacity
                key={role}
                className={`px-4 py-2 rounded-full min-w-[80px] items-center ${
                  selectedRole === role ? "bg-blue-600" : "bg-gray-200"
                }`}
                onPress={() => setSelectedRole(role as any)}
              >
                <Text
                  className={`font-medium capitalize text-sm ${
                    selectedRole === role ? "text-white" : "text-gray-700"
                  }`}
                >
                  {role === "all" ? "All Users" : role === "passenger" ? "Students" : role}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Users List */}
      <ScrollView
        className="flex-1 px-6 py-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-500">Loading users...</Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="people-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 text-lg mt-4">No users found</Text>
          </View>
        ) : (
          filteredUsers.map((user) => <UserCard key={user.id} user={user} />)
        )}
      </ScrollView>

      {/* User Details Modal */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUserModal(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          {selectedUser && (
            <>
              {/* Modal Header */}
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
                <Text className="text-xl font-bold text-gray-900">User Details</Text>
                <TouchableOpacity onPress={() => setShowUserModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1 px-6 py-6">
                {/* User Info */}
                <View className="bg-gray-50 rounded-xl p-4 mb-6">
                  <View className="flex-row items-center mb-2">
                    <Text className="text-2xl font-bold text-gray-900">
                      {selectedUser.firstName}{" "}
                      {selectedUser.middleName ? `${selectedUser.middleName} ` : ""}
                      {selectedUser.lastName}
                    </Text>
                    {((selectedUser.role === "driver" && selectedUser.driverProfile?.isVerified) ||
                      (selectedUser.role === "passenger" &&
                        selectedUser.studentProfile?.isVerified)) && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#10B981"
                        style={{ marginLeft: 8 }}
                      />
                    )}
                  </View>
                  <Text className="text-gray-600 mb-4">{selectedUser.email}</Text>

                  {/* Profile-specific information */}
                  {selectedUser.role === "driver" && selectedUser.driverProfile && (
                    <View className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                      <Text className="text-gray-900 font-semibold mb-2">Driver Information</Text>
                      <View className="space-y-2">
                        <View className="flex-row">
                          <Text className="text-gray-600 w-24">Username:</Text>
                          <Text className="text-gray-900 font-medium">
                            @{selectedUser.driverProfile.username}
                          </Text>
                        </View>
                        <View className="flex-row">
                          <Text className="text-gray-600 w-24">Age:</Text>
                          <Text className="text-gray-900">
                            {selectedUser.driverProfile.age} years old
                          </Text>
                        </View>
                        <View className="flex-row">
                          <Text className="text-gray-600 w-24">Contact:</Text>
                          <Text className="text-gray-900">
                            {selectedUser.driverProfile.contactNumber}
                          </Text>
                        </View>
                        <View className="flex-row">
                          <Text className="text-gray-600 w-24">Address:</Text>
                          <Text className="text-gray-900 flex-1">
                            {selectedUser.driverProfile.address}
                          </Text>
                        </View>
                        <View className="flex-row">
                          <Text className="text-gray-600 w-24">Status:</Text>
                          <Text
                            className={`font-medium ${selectedUser.driverProfile.isVerified ? "text-green-600" : "text-yellow-600"}`}
                          >
                            {selectedUser.driverProfile.isVerified
                              ? "Verified"
                              : "Pending Verification"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {selectedUser.role === "passenger" && selectedUser.studentProfile && (
                    <View className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                      <Text className="text-gray-900 font-semibold mb-2">Student Information</Text>
                      <View className="space-y-2">
                        <View className="flex-row">
                          <Text className="text-gray-600 w-24">Student ID:</Text>
                          <Text className="text-gray-900 font-medium">
                            {selectedUser.studentProfile.studentId}
                          </Text>
                        </View>
                        {selectedUser.studentProfile.course && (
                          <View className="flex-row">
                            <Text className="text-gray-600 w-24">Course:</Text>
                            <Text className="text-gray-900">
                              {selectedUser.studentProfile.course}
                            </Text>
                          </View>
                        )}
                        {selectedUser.studentProfile.yearLevel && (
                          <View className="flex-row">
                            <Text className="text-gray-600 w-24">Year Level:</Text>
                            <Text className="text-gray-900">
                              {selectedUser.studentProfile.yearLevel}
                            </Text>
                          </View>
                        )}
                        {selectedUser.studentProfile.emergencyContactName && (
                          <View className="flex-row">
                            <Text className="text-gray-600 w-24">Emergency:</Text>
                            <Text className="text-gray-900">
                              {selectedUser.studentProfile.emergencyContactName}
                            </Text>
                          </View>
                        )}
                        {selectedUser.studentProfile.emergencyContactNumber && (
                          <View className="flex-row">
                            <Text className="text-gray-600 w-24">Contact:</Text>
                            <Text className="text-gray-900">
                              {selectedUser.studentProfile.emergencyContactNumber}
                            </Text>
                          </View>
                        )}
                        <View className="flex-row">
                          <Text className="text-gray-600 w-24">Status:</Text>
                          <Text
                            className={`font-medium ${selectedUser.studentProfile.isVerified ? "text-green-600" : "text-yellow-600"}`}
                          >
                            {selectedUser.studentProfile.isVerified
                              ? "Verified"
                              : "Pending Verification"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* General contact info */}
                  {(selectedUser.metadata?.phone || selectedUser.metadata?.address) && (
                    <View className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                      <Text className="text-gray-900 font-semibold mb-2">Contact Information</Text>
                      <View className="space-y-2">
                        {selectedUser.metadata.phone && (
                          <View className="flex-row">
                            <Text className="text-gray-600 w-24">Phone:</Text>
                            <Text className="text-gray-900">{selectedUser.metadata.phone}</Text>
                          </View>
                        )}
                        {selectedUser.metadata.address && (
                          <View className="flex-row">
                            <Text className="text-gray-600 w-24">Address:</Text>
                            <Text className="text-gray-900 flex-1">
                              {selectedUser.metadata.address}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  <View className="flex-row space-x-4">
                    <View
                      className="px-3 py-1 rounded-full"
                      style={{ backgroundColor: getRoleColor(selectedUser.role) + "20" }}
                    >
                      <Text
                        className="font-medium capitalize"
                        style={{ color: getRoleColor(selectedUser.role) }}
                      >
                        {selectedUser.role === "passenger" ? "student" : selectedUser.role}
                      </Text>
                    </View>
                    <View
                      className="px-3 py-1 rounded-full"
                      style={{ backgroundColor: getStatusColor(selectedUser.status) + "20" }}
                    >
                      <Text
                        className="font-medium capitalize"
                        style={{ color: getStatusColor(selectedUser.status) }}
                      >
                        {selectedUser.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View className="space-y-3 gap-3">
                  <Text className="text-lg font-semibold text-gray-900 mb-2">Actions</Text>

                  {/* Status Actions */}
                  {selectedUser.status !== "active" && (
                    <TouchableOpacity
                      className="bg-green-50 border border-green-200 rounded-xl p-4 flex-row items-center"
                      onPress={() =>
                        confirmUserStatusChange(
                          selectedUser.id,
                          "active",
                          `${selectedUser.firstName} ${selectedUser.lastName}`
                        )
                      }
                    >
                      <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                      <Text className="text-green-700 font-medium ml-3">Activate User</Text>
                    </TouchableOpacity>
                  )}

                  {selectedUser.status !== "inactive" && (
                    <TouchableOpacity
                      className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex-row items-center"
                      onPress={() =>
                        confirmUserStatusChange(
                          selectedUser.id,
                          "inactive",
                          `${selectedUser.firstName} ${selectedUser.lastName}`
                        )
                      }
                    >
                      <Ionicons name="pause-circle" size={24} color="#F59E0B" />
                      <Text className="text-yellow-700 font-medium ml-3">Deactivate User</Text>
                    </TouchableOpacity>
                  )}

                  {selectedUser.status !== "banned" && (
                    <TouchableOpacity
                      className="bg-red-50 border border-red-200 rounded-xl p-4 flex-row items-center"
                      onPress={() =>
                        confirmUserStatusChange(
                          selectedUser.id,
                          "banned",
                          `${selectedUser.firstName} ${selectedUser.lastName}`
                        )
                      }
                    >
                      <Ionicons name="ban" size={24} color="#EF4444" />
                      <Text className="text-red-700 font-medium ml-3">Ban User</Text>
                    </TouchableOpacity>
                  )}

                  {/* Delete User */}
                  <TouchableOpacity
                    className="bg-red-50 border border-red-200 rounded-xl p-4 flex-row items-center"
                    onPress={() =>
                      confirmDeleteUser(
                        selectedUser.id,
                        `${selectedUser.firstName} ${selectedUser.lastName}`
                      )
                    }
                  >
                    <Ionicons name="trash" size={24} color="#EF4444" />
                    <Text className="text-red-700 font-medium ml-3">Delete User</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
