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
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/src/contexts/AuthContext";
import { driverService, type Driver } from "@/src/services/driver.service";
import { vehicleService, type Vehicle } from "@/src/services/vehicle.service";
import { userService } from "@/src/services/user.service";
import { PWAInstallButton } from "@/src/components/PWAPrompt";

// Web compatibility utilities
const showAlert = (title: string, message?: string) => {
  if (Platform.OS === "web") {
    window.alert(`${title}${message ? `\n${message}` : ""}`);
  } else {
    Alert.alert(title, message);
  }
};

const showConfirm = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n${message}`)) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
  } else {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: onCancel },
      { text: "OK", onPress: onConfirm },
    ]);
  }
};

// Web-compatible TouchableOpacity styling
const getWebButtonStyle = (className: string) => {
  if (Platform.OS === "web") {
    return {
      className,
      style: { cursor: "pointer" as any },
    };
  }
  return { className };
};

export default function DriverProfileScreen() {
  const { user, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [driverProfile, setDriverProfile] = useState<Driver | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);

  // Editable fields
  const [editableData, setEditableData] = useState({
    username: "",
    address: "",
    contactNumber: "",
    age: "",
  });

  useEffect(() => {
    loadProfileData();
  }, [user?.id]);

  const loadProfileData = async (refresh = false) => {
    if (!user?.id) return;

    try {
      if (refresh) {
        setIsRefreshing(true);
      }

      // First get user data with driver profile
      const userResponse = await userService.getUserById(
        user.id,
        "id,firstName,lastName,email,role,status,driverProfile.id,driverProfile.userId,driverProfile.username,driverProfile.address,driverProfile.age,driverProfile.contactNumber,driverProfile.licensePhoto,driverProfile.validIdPhoto,driverProfile.isVerified"
      );

      let vehicleResponse: any = { success: false, data: null };

      // If driver profile exists, get vehicle using driver ID
      if (userResponse.success && userResponse.data?.driverProfile?.id) {
        vehicleResponse = await vehicleService
          .getVehicleByDriverId(userResponse.data.driverProfile.id)
          .catch(() => ({ success: false, data: null }));
      }

      console.log("User API Response:", userResponse);

      if (userResponse.success && userResponse.data) {
        const userData = userResponse.data;
        console.log("User Data:", userData);

        if (userData.driverProfile) {
          const profile = userData.driverProfile;
          console.log("Driver Profile Data:", profile);
          setDriverProfile(profile);

          // Set editable data
          setEditableData({
            username: profile.username || "",
            address: profile.address || "",
            contactNumber: profile.contactNumber || "",
            age: profile.age?.toString() || "",
          });
        } else {
          // Driver profile doesn't exist - show option to create one
          console.log("Driver profile not found in user data");
          setDriverProfile(null);

          // Show alert to create driver profile
          showConfirm(
            "Driver Profile Required",
            "You need to create a driver profile to access this feature. Would you like to create one now?",
            () => {
              setIsEditing(true);
              setEditableData({
                username: "",
                address: "",
                contactNumber: "",
                age: "",
              });
            }
          );
        }
      } else {
        console.log("Failed to load user data:", userResponse.message);
        showAlert("Error", "Failed to load profile data. Please try again.");
      }

      console.log("Vehicle API Response:", vehicleResponse);

      if (vehicleResponse && vehicleResponse.success && vehicleResponse.data) {
        console.log("Vehicle Data:", vehicleResponse.data);
        setVehicle(vehicleResponse.data);
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
      // Only show error for network/server issues, not missing data
      if (error instanceof Error && error.message.includes("Network")) {
        showAlert("Connection Error", "Please check your internet connection and try again.");
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
        username: editableData.username.trim(),
        address: editableData.address.trim(),
        contactNumber: editableData.contactNumber.trim(),
        age: parseInt(editableData.age) || 0,
      };

      let response;

      if (driverProfile && driverProfile.id) {
        // Update existing profile using driver ID
        response = await driverService.updateDriver(driverProfile.id, profileData);
      } else {
        // Create new profile using the regular driver creation endpoint
        response = await driverService.createDriver({
          ...profileData,
          user: { connect: { id: user.id } },
        });
      }

      if (response.success) {
        if (driverProfile) {
          setDriverProfile({ ...driverProfile, ...profileData });
        } else {
          setDriverProfile(response.data || null);
        }
        setIsEditing(false);
        showAlert(
          "Success",
          driverProfile ? "Profile updated successfully!" : "Profile created successfully!"
        );
      } else {
        showAlert("Error", response.message || "Failed to save profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      showAlert("Error", "Failed to save profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset to original values or empty if no profile exists
    setEditableData({
      username: driverProfile?.username || "",
      address: driverProfile?.address || "",
      contactNumber: driverProfile?.contactNumber || "",
      age: driverProfile?.age?.toString() || "",
    });
    setIsEditing(false);
  };

  const handleDocumentUpload = async (documentType: "license" | "validId") => {
    try {
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showAlert(
          "Permission Required",
          "Please grant permission to access your photos to upload documents."
        );
        return;
      }

      // Show options for camera or library
      if (Platform.OS === "web") {
        // On web, only show library picker
        openImagePicker(documentType, "library");
      } else {
        Alert.alert(
          "Upload Document",
          `Select ${documentType === "license" ? "License Photo" : "Valid ID"}`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Camera", onPress: () => openImagePicker(documentType, "camera") },
            { text: "Photo Library", onPress: () => openImagePicker(documentType, "library") },
          ]
        );
      }
    } catch (error) {
      console.error("Error requesting permissions:", error);
      showAlert("Error", "Failed to access camera/photos. Please try again.");
    }
  };

  const openImagePicker = async (
    documentType: "license" | "validId",
    source: "camera" | "library"
  ) => {
    try {
      setIsUploadingDocument(true);

      let result;
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          showAlert("Permission Required", "Please grant camera permission to take photos.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        // Upload the document to the API
        await uploadDocumentToAPI(documentType, result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showAlert("Error", "Failed to select image. Please try again.");
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const uploadDocumentToAPI = async (documentType: "license" | "validId", imageUri: string) => {
    try {
      if (!driverProfile?.id) {
        showAlert("Error", "Driver profile not found. Please try again.");
        return;
      }

      // Prepare the file object for upload
      const fileExtension = imageUri.split(".").pop() || "jpg";
      const fileName = `${documentType}_${Date.now()}.${fileExtension}`;
      const mimeType = `image/${fileExtension === "jpg" ? "jpeg" : fileExtension}`;

      const files: any = {};

      if (Platform.OS === "web") {
        // On web, fetch the blob and convert to File
        try {
          const fetchResponse = await fetch(imageUri);
          const blob = await fetchResponse.blob();
          // Convert blob to File object for web
          const fileObject = new File([blob], fileName, { type: mimeType });

          if (documentType === "license") {
            files.licensePhoto = fileObject;
          } else {
            files.validIdPhoto = fileObject;
          }
        } catch (fetchError) {
          console.error("Error processing image:", fetchError);
          showAlert("Error", "Failed to process image. Please try again.");
          return;
        }
      } else {
        // On native, use URI approach
        const fileObject = {
          uri: imageUri,
          name: fileName,
          type: mimeType,
        };
        if (documentType === "license") {
          files.licensePhoto = fileObject;
        } else {
          files.validIdPhoto = fileObject;
        }
      }

      // Use service method for both platforms
      const uploadResponse = await driverService.uploadRequirements(driverProfile.id, files);

      if (uploadResponse.success) {
        // Update local state with the new data
        if (uploadResponse.data?.driver) {
          setDriverProfile({
            ...driverProfile,
            ...uploadResponse.data.driver,
          });
        }

        // Show success message with verification status
        const isNowVerified = uploadResponse.data?.driver?.isVerified;
        showAlert(
          "Success",
          `${documentType === "license" ? "License photo" : "Valid ID"} uploaded successfully!${
            isNowVerified ? " Your driver profile is now verified!" : ""
          }`
        );

        // Refresh profile data to get updated verification status
        await loadProfileData();
      } else {
        showAlert("Upload Failed", uploadResponse.message || "Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      showAlert("Error", "Failed to upload document. Please try again.");
    }
  };

  const handleVehicleDocumentUpload = async (documentType: "vehiclePhoto" | "orCrPhoto") => {
    try {
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showAlert(
          "Permission Required",
          "Please grant permission to access your photos to upload documents."
        );
        return;
      }

      // Show options for camera or library
      if (Platform.OS === "web") {
        // On web, only show library picker
        openVehicleImagePicker(documentType, "library");
      } else {
        Alert.alert(
          "Upload Document",
          `Select ${documentType === "vehiclePhoto" ? "Vehicle Photo" : "OR/CR Document"}`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Camera", onPress: () => openVehicleImagePicker(documentType, "camera") },
            {
              text: "Photo Library",
              onPress: () => openVehicleImagePicker(documentType, "library"),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error requesting permissions:", error);
      showAlert("Error", "Failed to access camera/photos. Please try again.");
    }
  };

  const openVehicleImagePicker = async (
    documentType: "vehiclePhoto" | "orCrPhoto",
    source: "camera" | "library"
  ) => {
    try {
      setIsUploadingDocument(true);

      let result;
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          showAlert("Permission Required", "Please grant camera permission to take photos.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        // Upload the document to the API
        await uploadVehicleDocumentToAPI(documentType, result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showAlert("Error", "Failed to select image. Please try again.");
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const uploadVehicleDocumentToAPI = async (
    documentType: "vehiclePhoto" | "orCrPhoto",
    imageUri: string
  ) => {
    try {
      if (!vehicle?.id) {
        showAlert("Error", "Vehicle not found. Please try again.");
        return;
      }

      // Prepare the file object for upload
      const fileExtension = imageUri.split(".").pop() || "jpg";
      const fileName = `${documentType}_${Date.now()}.${fileExtension}`;
      const mimeType = `image/${fileExtension === "jpg" ? "jpeg" : fileExtension}`;

      const files: any = {};

      if (Platform.OS === "web") {
        // On web, fetch the blob and convert to File
        try {
          const fileResponse = await fetch(imageUri);
          const blob = await fileResponse.blob();
          // Convert blob to File object for web
          const fileObject = new File([blob], fileName, { type: mimeType });

          if (documentType === "vehiclePhoto") {
            files.vehiclePhoto = fileObject;
          } else {
            files.orCrPhoto = fileObject;
          }
        } catch (fetchError) {
          console.error("Error processing image:", fetchError);
          showAlert("Error", "Failed to process image. Please try again.");
          return;
        }
      } else {
        // On native, use URI approach
        const fileObject = {
          uri: imageUri,
          name: fileName,
          type: mimeType,
        };
        if (documentType === "vehiclePhoto") {
          files.vehiclePhoto = fileObject;
        } else {
          files.orCrPhoto = fileObject;
        }
      }

      // Use service method for both platforms
      const response = await vehicleService.uploadVehicleDocuments(vehicle.id, files);

      if (response.success) {
        // Update local state with the new data
        if (response.data?.vehicle) {
          setVehicle({
            ...vehicle,
            ...response.data.vehicle,
          });
        }

        showAlert(
          "Success",
          `${documentType === "vehiclePhoto" ? "Vehicle photo" : "OR/CR document"} uploaded successfully!`
        );

        // Refresh profile data to get updated vehicle status
        await loadProfileData();
      } else {
        showAlert("Upload Failed", response.message || "Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading vehicle document:", error);
      showAlert("Error", "Failed to upload document. Please try again.");
    }
  };

  const handleDeleteVehicleDocument = async (documentType: "vehiclePhoto" | "orCrPhoto") => {
    if (!vehicle?.id) {
      showAlert("Error", "Vehicle not found. Please try again.");
      return;
    }

    showConfirm(
      "Delete Document",
      `Are you sure you want to delete your ${documentType === "vehiclePhoto" ? "vehicle photo" : "OR/CR document"}?`,
      async () => {
        try {
          setIsUploadingDocument(true);

          const response = await vehicleService.deleteVehicleDocuments(vehicle.id, documentType);

          if (response.success) {
            // Update local state
            if (response.data) {
              setVehicle({
                ...vehicle,
                ...response.data,
              });
            }

            showAlert(
              "Success",
              `${documentType === "vehiclePhoto" ? "Vehicle photo" : "OR/CR document"} deleted successfully.`
            );

            // Refresh profile data
            await loadProfileData();
          } else {
            showAlert("Delete Failed", response.message || "Failed to delete document");
          }
        } catch (error) {
          console.error("Error deleting vehicle document:", error);
          showAlert("Error", "Failed to delete document. Please try again.");
        } finally {
          setIsUploadingDocument(false);
        }
      }
    );
  };

  const handleDeleteDocument = async (documentType: "license" | "validId") => {
    if (!driverProfile?.id) {
      showAlert("Error", "Driver profile not found. Please try again.");
      return;
    }

    showConfirm(
      "Delete Document",
      `Are you sure you want to delete your ${documentType === "license" ? "license photo" : "valid ID"}? This will affect your verification status.`,
      async () => {
        try {
          setIsUploadingDocument(true);

          const response = await driverService.deleteRequirements(driverProfile.id, documentType);

          if (response.success) {
            // Update local state
            if (response.data) {
              setDriverProfile({
                ...driverProfile,
                ...response.data,
              });
            }

            showAlert(
              "Success",
              `${documentType === "license" ? "License photo" : "Valid ID"} deleted successfully.`
            );

            // Refresh profile data
            await loadProfileData();
          } else {
            showAlert("Delete Failed", response.message || "Failed to delete document");
          }
        } catch (error) {
          console.error("Error deleting document:", error);
          showAlert("Error", "Failed to delete document. Please try again.");
        } finally {
          setIsUploadingDocument(false);
        }
      }
    );
  };

  const handleLogout = () => {
    showConfirm("Confirm Logout", "Are you sure you want to logout?", async () => {
      await logout();
      router.replace("/(onboarding)/welcome");
    });
  };

  const renderProfileField = (
    label: string,
    value: string,
    field: keyof typeof editableData,
    icon: string,
    keyboardType: "default" | "numeric" | "phone-pad" = "default"
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
        />
      ) : (
        <Text className="text-black text-lg bg-gray-50 rounded-xl px-4 py-3">
          {value || "Not provided"}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-black px-6 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} {...getWebButtonStyle("mr-4")}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">Profile</Text>
        </View>

        <TouchableOpacity onPress={handleLogout} {...getWebButtonStyle("flex-row items-center")}>
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
          <View className="mb-6 items-center">
            <View className="w-20 h-20 bg-black rounded-full mb-4 items-center justify-center self-center">
              <Text className="text-white text-2xl font-bold">
                {user?.firstName?.charAt(0) || "D"}
              </Text>
            </View>
            <Text
              className="text-black text-xl font-bold text-center"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {user?.firstName} {user?.lastName}
            </Text>
            <Text className="text-gray-600 text-center">{user?.email}</Text>

            {/* Verification Status */}
            <View
              className={`flex-row items-center mt-3 px-3 py-1 rounded-full ${
                driverProfile?.isVerified ? "bg-green-100" : "bg-yellow-100"
              }`}
            >
              <Ionicons
                name={driverProfile?.isVerified ? "checkmark-circle" : "time"}
                size={16}
                color={driverProfile?.isVerified ? "#22c55e" : "#f59e0b"}
              />
              <Text
                className={`ml-2 font-medium ${
                  driverProfile?.isVerified ? "text-green-700" : "text-yellow-700"
                }`}
              >
                {driverProfile?.isVerified ? "Verified Driver" : "Pending Verification"}
              </Text>
            </View>
          </View>
        </View>

        {/* Driver Information */}
        <View className="bg-white mx-6 mt-6 rounded-2xl p-6 shadow-sm">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-black text-lg font-semibold">Driver Information</Text>
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

          {renderProfileField("Username", editableData.username, "username", "person")}
          {renderProfileField("Address", editableData.address, "address", "location")}
          {renderProfileField(
            "Contact Number",
            editableData.contactNumber,
            "contactNumber",
            "call",
            "phone-pad"
          )}
          {renderProfileField("Age", editableData.age, "age", "calendar", "numeric")}
        </View>

        {/* Required Documents */}
        <View className="bg-white mx-6 mt-6 rounded-2xl p-6 shadow-sm">
          <Text className="text-black text-lg font-semibold mb-4">Required Documents</Text>
          <Text className="text-gray-600 mb-6 text-sm">
            Upload the required documents to complete your driver verification process.
          </Text>

          {/* License Photo */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Ionicons name="card" size={20} color="#6b7280" />
                <Text className="text-black font-medium ml-3">Driver's License Photo</Text>
              </View>
              <View className="flex-row items-center">
                {driverProfile?.licensePhoto && (
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" className="mr-2" />
                )}
                <TouchableOpacity
                  onPress={() => handleDocumentUpload("license")}
                  disabled={isUploadingDocument}
                  className="bg-gray-100 rounded-lg px-3 py-2"
                >
                  {isUploadingDocument ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text className="text-black font-medium">
                      {driverProfile?.licensePhoto ? "Replace" : "Upload"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {driverProfile?.licensePhoto ? (
              <View className="bg-green-50 border border-green-200 rounded-xl p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                    <Text className="text-green-700 ml-2 font-medium">License photo uploaded</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteDocument("license")} className="p-2">
                    <Ionicons name="trash" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <Text className="text-green-600 text-sm mt-1">
                  Your driver's license has been submitted for verification.
                </Text>
              </View>
            ) : (
              <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <View className="flex-row items-center">
                  <Ionicons name="warning" size={20} color="#f59e0b" />
                  <Text className="text-yellow-700 ml-2 font-medium">License photo required</Text>
                </View>
                <Text className="text-yellow-600 text-sm mt-1">
                  Please upload a clear photo of your driver's license.
                </Text>
              </View>
            )}
          </View>

          {/* Valid ID */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Ionicons name="id-card" size={20} color="#6b7280" />
                <Text className="text-black font-medium ml-3">Valid Government ID</Text>
              </View>
              <View className="flex-row items-center">
                {driverProfile?.validIdPhoto && (
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" className="mr-2" />
                )}
                <TouchableOpacity
                  onPress={() => handleDocumentUpload("validId")}
                  disabled={isUploadingDocument}
                  className="bg-gray-100 rounded-lg px-3 py-2"
                >
                  {isUploadingDocument ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text className="text-black font-medium">
                      {driverProfile?.validIdPhoto ? "Replace" : "Upload"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {driverProfile?.validIdPhoto ? (
              <View className="bg-green-50 border border-green-200 rounded-xl p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                    <Text className="text-green-700 ml-2 font-medium">Valid ID uploaded</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteDocument("validId")} className="p-2">
                    <Ionicons name="trash" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <Text className="text-green-600 text-sm mt-1">
                  Your government ID has been submitted for verification.
                </Text>
              </View>
            ) : (
              <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <View className="flex-row items-center">
                  <Ionicons name="warning" size={20} color="#f59e0b" />
                  <Text className="text-yellow-700 ml-2 font-medium">Valid ID required</Text>
                </View>
                <Text className="text-yellow-600 text-sm mt-1">
                  Please upload a valid government-issued ID (SSS, UMID, Postal ID, etc.).
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Vehicle Information */}
        <View className="bg-white mx-6 mt-6 rounded-2xl p-6 shadow-sm">
          <Text className="text-black text-lg font-semibold mb-4">Vehicle Information</Text>

          {vehicle ? (
            <View>
              <View className="mb-6">
                <View className="flex-row items-center justify-between p-4 bg-gray-50 rounded-xl mb-4">
                  <View className="flex-row items-center">
                    <Ionicons name="car" size={20} color="#6b7280" />
                    <View className="ml-3">
                      <Text className="text-black font-medium">Plate Number</Text>
                      <Text className="text-gray-600">{vehicle.plateNumber}</Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <View className="flex-row items-center">
                    <Ionicons name="receipt" size={20} color="#6b7280" />
                    <View className="ml-3">
                      <Text className="text-black font-medium">Body Number</Text>
                      <Text className="text-gray-600">{vehicle.bodyNumber}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Vehicle Documents */}
              <View className="border-t border-gray-200 pt-4">
                <Text className="text-black font-semibold mb-4">Vehicle Documents</Text>

                {/* Vehicle Photo */}
                <View className="mb-4">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <Ionicons name="camera" size={16} color="#6b7280" />
                      <Text className="text-gray-700 ml-2">Vehicle Photo</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleVehicleDocumentUpload("vehiclePhoto")}
                      disabled={isUploadingDocument}
                      className="bg-gray-100 rounded-lg px-3 py-1"
                    >
                      {isUploadingDocument ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <Text className="text-black text-sm font-medium">
                          {vehicle.vehiclePhoto ? "Replace" : "Upload"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  {vehicle.vehiclePhoto ? (
                    <View className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                          <Text className="text-green-700 ml-2 font-medium">
                            Vehicle photo uploaded
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteVehicleDocument("vehiclePhoto")}
                          className="p-2"
                        >
                          <Ionicons name="trash" size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                      <Text className="text-green-600 text-sm mt-1">
                        Your vehicle photo has been uploaded successfully.
                      </Text>
                    </View>
                  ) : (
                    <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <View className="flex-row items-center">
                        <Ionicons name="warning" size={20} color="#f59e0b" />
                        <Text className="text-yellow-700 ml-2 font-medium">
                          Vehicle photo required
                        </Text>
                      </View>
                      <Text className="text-yellow-600 text-sm mt-1">
                        Please upload a clear photo of your vehicle.
                      </Text>
                    </View>
                  )}
                </View>

                {/* OR/CR Upload */}
                <View>
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <Ionicons name="document" size={16} color="#6b7280" />
                      <Text className="text-gray-700 ml-2">OR/CR Document</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleVehicleDocumentUpload("orCrPhoto")}
                      disabled={isUploadingDocument}
                      className="bg-gray-100 rounded-lg px-3 py-1"
                    >
                      {isUploadingDocument ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <Text className="text-black text-sm font-medium">
                          {vehicle.orCrPhoto ? "Replace" : "Upload"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  {vehicle.orCrPhoto ? (
                    <View className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                          <Text className="text-green-700 ml-2 font-medium">
                            OR/CR document uploaded
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteVehicleDocument("orCrPhoto")}
                          className="p-2"
                        >
                          <Ionicons name="trash" size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                      <Text className="text-green-600 text-sm mt-1">
                        Your OR/CR document has been uploaded successfully.
                      </Text>
                    </View>
                  ) : (
                    <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <View className="flex-row items-center">
                        <Ionicons name="warning" size={20} color="#f59e0b" />
                        <Text className="text-yellow-700 ml-2 font-medium">
                          OR/CR document required
                        </Text>
                      </View>
                      <Text className="text-yellow-600 text-sm mt-1">
                        Please upload your Official Receipt (OR) and Certificate of Registration
                        (CR).
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ) : (
            <View>
              <View className="items-center py-8">
                <Ionicons name="car-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-500 mt-2">No vehicle registered</Text>
                <Text className="text-gray-400 text-sm text-center mt-1">
                  Contact support to register your vehicle
                </Text>
              </View>

              {/* Vehicle Registration Call-to-Action */}
              <View className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="information-circle" size={20} color="#3b82f6" />
                  <Text className="text-blue-700 font-medium ml-2">
                    Vehicle Registration Required
                  </Text>
                </View>
                <Text className="text-blue-600 text-sm mb-3">
                  To complete your driver verification, please register your tricycle with the
                  following documents:
                </Text>
                <View className="ml-4">
                  <Text className="text-blue-600 text-sm">• Vehicle Photo</Text>
                  <Text className="text-blue-600 text-sm">• Official Receipt (OR)</Text>
                  <Text className="text-blue-600 text-sm">• Certificate of Registration (CR)</Text>
                </View>
                <TouchableOpacity className="bg-blue-600 rounded-lg py-2 px-4 mt-3">
                  <Text className="text-white text-center font-medium">Contact Support</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Account Settings */}
        <View className="bg-white mx-6 mt-6 mb-6 rounded-2xl p-6 shadow-sm">
          <Text className="text-black text-lg font-semibold mb-4">Account Settings</Text>

          {Platform.OS === "web" && <PWAInstallButton />}

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
