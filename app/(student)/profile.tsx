import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/src/contexts/AuthContext";
import { studentService, type Student } from "@/src/services/student.service";
import { userService } from "@/src/services/user.service";

export default function StudentProfileScreen() {
  const { user, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [userData, setUserData] = useState<any>(user);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingEmergencyContact, setIsEditingEmergencyContact] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);

  // Editable fields
  const [editableData, setEditableData] = useState({
    studentId: "",
    course: "",
    yearLevel: "",
    schoolEmail: "",
    emergencyContactName: "",
    emergencyContactNumber: "",
    dateOfBirth: "",
  });

  useEffect(() => {
    loadProfileData();
  }, [user?.id]);

  useEffect(() => {
    setUserData(user);
  }, [user]);

  const loadProfileData = async (refresh = false) => {
    if (!user?.id) return;

    try {
      if (refresh) {
        setIsRefreshing(true);
      }

      // Get user data with student profile
      const userResponse = await userService.getUserById(
        user.id,
        "id,firstName,lastName,middleName,email,role,status,studentProfile.id,studentProfile.userId,studentProfile.studentId,studentProfile.dateOfBirth,studentProfile.course,studentProfile.yearLevel,studentProfile.schoolEmail,studentProfile.emergencyContactName,studentProfile.emergencyContactNumber,studentProfile.studentIdPhoto,studentProfile.isVerified"
      );

      console.log("User API Response:", userResponse);

      if (userResponse.success && userResponse.data) {
        const freshUserData = userResponse.data;
        console.log("User Data:", freshUserData);
        setUserData(freshUserData);

        if ((freshUserData as any).studentProfile) {
          const profile = (freshUserData as any).studentProfile;
          console.log("Student Profile Data:", profile);
          setStudentProfile(profile);

          // Set editable data
          setEditableData({
            studentId: profile.studentId || "",
            course: profile.course || "",
            yearLevel: profile.yearLevel || "",
            schoolEmail: profile.schoolEmail || "",
            emergencyContactName: profile.emergencyContactName || "",
            emergencyContactNumber: profile.emergencyContactNumber || "",
            dateOfBirth: profile.dateOfBirth
              ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
              : "",
          });
        } else {
          // Student profile doesn't exist - show option to create one
          console.log("Student profile not found in user data");
          setStudentProfile(null);

          Alert.alert(
            "Student Profile Required",
            "You need to create a student profile to access this feature. Would you like to create one now?",
            [
              { text: "Later", style: "cancel" },
              {
                text: "Create Profile",
                onPress: () => {
                  setIsEditing(true);
                  setEditableData({
                    studentId: "",
                    course: "",
                    yearLevel: "",
                    schoolEmail: "",
                    emergencyContactName: "",
                    emergencyContactNumber: "",
                    dateOfBirth: "",
                  });
                },
              },
            ]
          );
        }
      } else {
        console.log("Failed to load user data:", userResponse.message);
        Alert.alert("Error", "Failed to load profile data. Please try again.");
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
      if (error instanceof Error && error.message.includes("Network")) {
        Alert.alert("Connection Error", "Please check your internet connection and try again.");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!user?.id) return;

    try {
      setIsUpdating(true);

      const profileData = {
        studentId: editableData.studentId.trim(),
        course: editableData.course.trim(),
        yearLevel: editableData.yearLevel.trim(),
        schoolEmail: editableData.schoolEmail.trim(),
        emergencyContactName: editableData.emergencyContactName.trim(),
        emergencyContactNumber: editableData.emergencyContactNumber.trim(),
        dateOfBirth: editableData.dateOfBirth ? new Date(editableData.dateOfBirth) : undefined,
      };

      let response;

      if (studentProfile && studentProfile.id) {
        // Update existing profile
        response = await studentService.updateStudent(studentProfile.id, {
          ...profileData,
          dateOfBirth: profileData.dateOfBirth?.toISOString(),
        });
      } else {
        // Create new profile
        response = await studentService.createStudent({
          ...profileData,
          dateOfBirth: profileData.dateOfBirth || new Date(),
          user: { connect: { id: user.id } },
        });
      }

      if (response.success) {
        if (studentProfile) {
          // Update the profile with the API response data
          setStudentProfile(response.data || studentProfile);
        } else {
          setStudentProfile(response.data || null);
        }
        setIsEditing(false);
        Alert.alert(
          "Success",
          studentProfile ? "Profile updated successfully!" : "Profile created successfully!"
        );
      } else {
        Alert.alert("Error", response.message || "Failed to save profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditableData({
      studentId: studentProfile?.studentId || "",
      course: studentProfile?.course || "",
      yearLevel: studentProfile?.yearLevel || "",
      schoolEmail: studentProfile?.schoolEmail || "",
      emergencyContactName: studentProfile?.emergencyContactName || "",
      emergencyContactNumber: studentProfile?.emergencyContactNumber || "",
      dateOfBirth: studentProfile?.dateOfBirth
        ? new Date(studentProfile.dateOfBirth).toISOString().split("T")[0]
        : "",
    });
    setIsEditing(false);
  };

  const handleSaveEmergencyContact = async () => {
    if (!user?.id || !studentProfile?.id) return;

    try {
      setIsUpdating(true);

      const emergencyContactData = {
        emergencyContactName: editableData.emergencyContactName.trim(),
        emergencyContactNumber: editableData.emergencyContactNumber.trim(),
      };

      const response = await studentService.updateStudent(studentProfile.id, emergencyContactData);

      if (response.success) {
        setStudentProfile({ ...studentProfile, ...emergencyContactData });
        setIsEditingEmergencyContact(false);
        Alert.alert("Success", "Emergency contact updated successfully!");
      } else {
        Alert.alert("Error", response.message || "Failed to update emergency contact");
      }
    } catch (error) {
      console.error("Error updating emergency contact:", error);
      Alert.alert("Error", "Failed to update emergency contact. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEmergencyContactEdit = () => {
    setEditableData({
      ...editableData,
      emergencyContactName: studentProfile?.emergencyContactName || "",
      emergencyContactNumber: studentProfile?.emergencyContactNumber || "",
    });
    setIsEditingEmergencyContact(false);
  };

  const handleUploadStudentID = async () => {
    // Create student profile if it doesn't exist
    if (!studentProfile?.id) {
      Alert.alert("Info", "Creating student profile first...");
      // You can either create the profile here or skip this check
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions to upload documents"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingDocument(true);

        const asset = result.assets[0];
        const formData = new FormData();

        // Create file object for FormData
        const fileUri = asset.uri;
        const filename = fileUri.split("/").pop() || "student-id.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("studentIdPhoto", {
          uri: fileUri,
          type: type,
          name: filename,
        } as any);

        if (studentProfile?.id) {
          const response = await studentService.uploadStudentIDPhoto(studentProfile.id, formData);

          if (response.success && response.data) {
            // Update local state with the response
            const updatedStudent = response.data.student;
            setStudentProfile(updatedStudent);

            Alert.alert("Success", "Student ID photo uploaded successfully!");

            // Refresh the profile data to get latest state
            await loadProfileData();
          } else {
            Alert.alert("Error", response.message || "Failed to upload student ID photo");
          }
        } else {
          Alert.alert(
            "Error",
            "Please create your student profile first by filling out the Student Information section"
          );
        }
      }
    } catch (error) {
      console.error("Error uploading student ID:", error);
      Alert.alert("Error", "Failed to upload student ID photo. Please try again.");
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const handleDeleteStudentID = async () => {
    if (!studentProfile?.id || !studentProfile?.studentIdPhoto) {
      return;
    }

    Alert.alert(
      "Delete Student ID",
      "Are you sure you want to delete your student ID photo? This will require re-verification.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsUploadingDocument(true);

              const response = await studentService.deleteStudentIDPhoto(studentProfile.id);

              if (response.success && response.data) {
                setStudentProfile(response.data);
                Alert.alert("Success", "Student ID photo deleted successfully");

                // Refresh the profile data
                await loadProfileData();
              } else {
                Alert.alert("Error", response.message || "Failed to delete student ID photo");
              }
            } catch (error) {
              console.error("Error deleting student ID:", error);
              Alert.alert("Error", "Failed to delete student ID photo. Please try again.");
            } finally {
              setIsUploadingDocument(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(onboarding)/welcome");
        },
      },
    ]);
  };

  const renderProfileField = (
    label: string,
    value: string,
    field: keyof typeof editableData,
    icon: string,
    keyboardType: "default" | "numeric" | "phone-pad" | "email-address" = "default",
    multiline = false
  ) => (
    <View className="mb-4">
      <View className="flex-row items-center mb-2">
        <Ionicons name={icon as any} size={16} color="#6b7280" />
        <Text className="text-gray-600 ml-2 font-medium">{label}</Text>
      </View>
      {isEditing ? (
        <TextInput
          value={editableData[field]}
          onChangeText={(text) => setEditableData({ ...editableData, [field]: text })}
          className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-black"
          placeholder={`Enter ${label.toLowerCase()}`}
          keyboardType={keyboardType}
          placeholderTextColor="#9ca3af"
          multiline={multiline}
        />
      ) : (
        <Text className="text-black text-lg bg-gray-50 rounded-xl px-4 py-3">
          {value || "Not provided"}
        </Text>
      )}
    </View>
  );

  const renderEmergencyContactField = (
    label: string,
    value: string,
    field: keyof typeof editableData,
    icon: string,
    keyboardType: "default" | "numeric" | "phone-pad" | "email-address" = "default",
    multiline = false
  ) => (
    <View className="mb-4">
      <View className="flex-row items-center mb-2">
        <Ionicons name={icon as any} size={16} color="#6b7280" />
        <Text className="text-gray-600 ml-2 font-medium">{label}</Text>
      </View>
      {isEditingEmergencyContact ? (
        <TextInput
          value={editableData[field]}
          onChangeText={(text) => setEditableData({ ...editableData, [field]: text })}
          className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-black"
          placeholder={`Enter ${label.toLowerCase()}`}
          keyboardType={keyboardType}
          placeholderTextColor="#9ca3af"
          multiline={multiline}
        />
      ) : (
        <Text className="text-black text-lg bg-gray-50 rounded-xl px-4 py-3">
          {value || "Not provided"}
        </Text>
      )}
    </View>
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not provided";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-black px-6 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">Profile</Text>
        </View>

        <TouchableOpacity onPress={handleLogout} className="flex-row items-center">
          <Ionicons name="log-out" size={20} color="white" />
          <Text className="text-white ml-2">Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadProfileData(true)}
            colors={["#000000"]}
          />
        }
      >
        {/* Profile Header */}
        <View className="bg-white mx-6 mt-6 rounded-2xl p-6 shadow-sm">
          <View className="mb-6">
            <View className="w-20 h-20 bg-black rounded-full mb-4 items-center justify-center self-center">
              <Text className="text-white text-2xl font-bold">
                {(userData?.firstName || user?.firstName)?.charAt(0) || "S"}
              </Text>
            </View>
            <Text
              className="text-black text-xl font-bold text-center"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {userData?.firstName || user?.firstName} {userData?.lastName || user?.lastName}
            </Text>
            <Text className="text-gray-600 text-center">{userData?.email || user?.email}</Text>

            {/* Verification Status */}
            <View
              className={`flex-row items-center justify-center mt-3 px-3 py-1 rounded-full self-center ${
                studentProfile?.isVerified ? "bg-green-100" : "bg-yellow-100"
              }`}
            >
              <Ionicons
                name={studentProfile?.isVerified ? "checkmark-circle" : "time"}
                size={16}
                color={studentProfile?.isVerified ? "#22c55e" : "#f59e0b"}
              />
              <Text
                className={`ml-2 font-medium ${
                  studentProfile?.isVerified ? "text-green-700" : "text-yellow-700"
                }`}
              >
                {studentProfile?.isVerified ? "Verified Student" : "Pending Verification"}
              </Text>
            </View>
          </View>
        </View>

        {/* Student Information */}
        <View className="bg-white mx-6 mt-6 rounded-2xl p-6 shadow-sm">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-black text-lg font-semibold">Student Information</Text>
            {!isEditing ? (
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2"
              >
                <Ionicons name="create" size={16} color="#000" />
                <Text className="text-black ml-2 font-medium">Edit</Text>
              </TouchableOpacity>
            ) : (
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  onPress={handleCancelEdit}
                  className="bg-gray-100 rounded-lg px-3 py-2"
                >
                  <Text className="text-gray-700 font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveChanges}
                  disabled={isUpdating}
                  className="bg-black rounded-lg px-3 py-2"
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-medium">Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {renderProfileField("Student ID", editableData.studentId, "studentId", "school")}
          {renderProfileField("Course", editableData.course, "course", "book")}
          {renderProfileField("Year Level", editableData.yearLevel, "yearLevel", "library")}
          {renderProfileField(
            "School Email",
            editableData.schoolEmail,
            "schoolEmail",
            "mail",
            "email-address"
          )}

          {/* Date of Birth - Special handling for date display */}
          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="calendar" size={16} color="#6b7280" />
              <Text className="text-gray-600 ml-2 font-medium">Date of Birth</Text>
            </View>
            {isEditing ? (
              <TextInput
                value={editableData.dateOfBirth}
                onChangeText={(text) => setEditableData({ ...editableData, dateOfBirth: text })}
                className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-black"
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
              />
            ) : (
              <Text className="text-black text-lg bg-gray-50 rounded-xl px-4 py-3">
                {studentProfile?.dateOfBirth
                  ? formatDate(studentProfile.dateOfBirth)
                  : "Not provided"}
              </Text>
            )}
          </View>
        </View>

        {/* Emergency Contact */}
        <View className="bg-white mx-6 mt-6 rounded-2xl p-6 shadow-sm">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-black text-lg font-semibold">Emergency Contact</Text>
            {!isEditingEmergencyContact ? (
              <TouchableOpacity
                onPress={() => setIsEditingEmergencyContact(true)}
                className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2"
              >
                <Ionicons name="create" size={16} color="#000" />
                <Text className="text-black ml-2 font-medium">Edit</Text>
              </TouchableOpacity>
            ) : (
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  onPress={handleCancelEmergencyContactEdit}
                  className="bg-gray-100 rounded-lg px-3 py-2"
                >
                  <Text className="text-gray-700 font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveEmergencyContact}
                  disabled={isUpdating}
                  className="bg-black rounded-lg px-3 py-2"
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-medium">Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {renderEmergencyContactField(
            "Contact Name",
            editableData.emergencyContactName,
            "emergencyContactName",
            "person"
          )}
          {renderEmergencyContactField(
            "Contact Number",
            editableData.emergencyContactNumber,
            "emergencyContactNumber",
            "call",
            "phone-pad"
          )}
        </View>

        {/* Required Documents */}
        <View className="bg-white mx-6 mt-6 rounded-2xl p-6 shadow-sm">
          <Text className="text-black text-lg font-semibold mb-4">Required Documents</Text>
          <Text className="text-gray-600 mb-6 text-sm">
            Upload your student ID to complete your verification process.
          </Text>

          {/* Student ID Photo */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Ionicons name="id-card" size={20} color="#6b7280" />
                <Text className="text-black font-medium ml-3">Student ID Photo</Text>
              </View>
              <View className="flex-row space-x-2 gap-2">
                {studentProfile?.studentIdPhoto && (
                  <TouchableOpacity
                    onPress={handleDeleteStudentID}
                    disabled={isUploadingDocument}
                    className="bg-red-100 rounded-lg px-3 py-2"
                  >
                    {isUploadingDocument ? (
                      <ActivityIndicator size="small" color="#dc2626" />
                    ) : (
                      <Text className="text-red-600 font-medium">Delete</Text>
                    )}
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleUploadStudentID}
                  disabled={false}
                  className="bg-black rounded-lg px-3 py-2"
                >
                  {isUploadingDocument ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-medium">
                      {studentProfile?.studentIdPhoto ? "Re-upload" : "Upload"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {studentProfile?.studentIdPhoto ? (
              <View className="bg-green-50 border border-green-200 rounded-xl p-4">
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                  <Text className="text-green-700 ml-2 font-medium">Student ID uploaded</Text>
                </View>
                <Text className="text-green-600 text-sm mt-1">
                  Your student ID has been submitted for verification.
                </Text>
              </View>
            ) : (
              <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <View className="flex-row items-center">
                  <Ionicons name="warning" size={20} color="#f59e0b" />
                  <Text className="text-yellow-700 ml-2 font-medium">Student ID required</Text>
                </View>
                <Text className="text-yellow-600 text-sm mt-1">
                  Please upload a clear photo of your student ID for verification.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Account Settings */}
        <View className="bg-white mx-6 mt-6 mb-6 rounded-2xl p-6 shadow-sm">
          <Text className="text-black text-lg font-semibold mb-4">Account Settings</Text>

          <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark" size={20} color="#6b7280" />
              <Text className="text-black ml-3">Privacy & Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="notifications" size={20} color="#6b7280" />
              <Text className="text-black ml-3">Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="help-circle" size={20} color="#6b7280" />
              <Text className="text-black ml-3">Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center">
              <Ionicons name="information-circle" size={20} color="#6b7280" />
              <Text className="text-black ml-3">About</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
