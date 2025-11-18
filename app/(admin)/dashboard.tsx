import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { Colors } from "@/src/constants/theme";
import { userService } from "@/src/services/user.service";
import { rideService } from "@/src/services/ride.service";
import { driverService } from "@/src/services/driver.service";
import { studentService } from "@/src/services/student.service";

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalDrivers: number;
  totalRides: number;
  totalRevenue: number;
  activeRides: number;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalDrivers: 0,
    totalRides: 0,
    totalRevenue: 0,
    activeRides: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch all data in parallel for better performance
      const [usersResponse, studentsResponse, driversResponse, ridesResponse] = await Promise.all([
        userService.getUsers({
          limit: 1000, // Get all users for counting
          filters: { fields: "id" },
        }),
        studentService.getStudents({
          limit: 1000, // Get all students for counting
          filters: { fields: "id" },
        }),
        driverService.getDrivers({
          limit: 1000, // Get all drivers for counting
          filters: { fields: "id" },
        }),
        rideService.getRides({
          fields: "id,fare,status",
          limit: 1000, // Get all rides for counting
        }),
      ]);

      if (
        usersResponse.success &&
        studentsResponse.success &&
        driversResponse.success &&
        ridesResponse.success
      ) {
        const users = usersResponse.data || [];
        const students = studentsResponse.data || [];
        const drivers = driversResponse.data || [];
        const rides = ridesResponse.data || [];

        const activeRides = rides.filter((r) =>
          ["pending", "accepted", "in_progress"].includes(r.status)
        ).length;
        const totalRevenue = rides
          .filter((r) => r.status === "completed")
          .reduce((sum, ride) => sum + (ride.fare || 0), 0);

        setStats({
          totalUsers: users.length,
          totalStudents: students.length,
          totalDrivers: drivers.length,
          totalRides: rides.length,
          totalRevenue,
          activeRides,
        });
      } else {
        // Handle partial failures
        console.error("Some API calls failed:", {
          users: usersResponse.success,
          students: studentsResponse.success,
          drivers: driversResponse.success,
          rides: ridesResponse.success,
        });
        Alert.alert("Warning", "Some data could not be loaded. Please try refreshing.");
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  const navigateToUsers = () => {
    router.push("/(admin)/users");
  };

  const navigateToFareManagement = () => {
    router.push("/(admin)/fare-management");
  };

  const navigateToReports = () => {
    router.push("/(admin)/reports");
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const StatCard = ({
    title,
    value,
    icon,
    color = Colors.light.tint,
  }: {
    title: string;
    value: string | number;
    icon: string;
    color?: string;
  }) => (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex-1 mx-1">
      <View className="flex-row items-center justify-between mb-2">
        <View
          className={`w-10 h-10 rounded-lg items-center justify-center`}
          style={{ backgroundColor: color + "20" }}
        >
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
      </View>
      <Text className="text-2xl font-bold text-gray-900 mb-1">{value}</Text>
      <Text className="text-sm text-gray-600">{title}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Admin Dashboard</Text>
            <Text className="text-gray-600">Welcome back, {user?.firstName}</Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="w-10 h-10 bg-red-50 rounded-lg items-center justify-center"
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Overview */}
        <View className="px-6 py-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Overview</Text>

          {/* First Row */}
          <View className="flex-row mb-4">
            <StatCard title="Total Users" value={stats.totalUsers} icon="people" color="#3B82F6" />
            <StatCard title="Students" value={stats.totalStudents} icon="school" color="#10B981" />
          </View>

          {/* Second Row */}
          <View className="flex-row mb-4">
            <StatCard title="Drivers" value={stats.totalDrivers} icon="car" color="#F59E0B" />
            <StatCard
              title="Active Rides"
              value={stats.activeRides}
              icon="location"
              color="#EF4444"
            />
          </View>

          {/* Third Row */}
          <View className="flex-row mb-4">
            <StatCard
              title="Total Rides"
              value={stats.totalRides}
              icon="analytics"
              color="#8B5CF6"
            />
            <StatCard
              title="Revenue"
              value={`₱${stats.totalRevenue.toLocaleString()}`}
              icon="wallet"
              color="#06B6D4"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</Text>

          <View className="space-y-3 gap-3">
            <TouchableOpacity
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex-row items-center"
              onPress={navigateToUsers}
              activeOpacity={0.7}
            >
              <View className="w-12 h-12 bg-blue-50 rounded-lg items-center justify-center mr-4">
                <Ionicons name="people" size={24} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold">Manage Users</Text>
                <Text className="text-gray-600 text-sm">View and manage all users</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex-row items-center"
              onPress={navigateToFareManagement}
              activeOpacity={0.7}
            >
              <View className="w-12 h-12 bg-green-50 rounded-lg items-center justify-center mr-4">
                <Ionicons name="calculator" size={24} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold">Fare Management</Text>
                <Text className="text-gray-600 text-sm">Set and adjust fare rates</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex-row items-center"
              onPress={navigateToReports}
              activeOpacity={0.7}
            >
              <View className="w-12 h-12 bg-purple-50 rounded-lg items-center justify-center mr-4">
                <Ionicons name="analytics" size={24} color="#8B5CF6" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold">View Reports</Text>
                <Text className="text-gray-600 text-sm">Analytics and insights</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
