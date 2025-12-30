import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { Colors } from "@/src/constants/theme";
import { showErrorAlert, showSuccessAlert } from "@/src/utils/alerts";

export default function AdminLoginScreen() {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      showErrorAlert("Validation Error", "Please enter your email address");
      return false;
    }

    if (!formData.password.trim()) {
      showErrorAlert("Validation Error", "Please enter your password");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showErrorAlert("Invalid Email", "Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
        role: "admin",
      });

      showSuccessAlert("Login Successful", "Welcome to Admin Dashboard!");
      // Navigation will be handled automatically by AuthContext
    } catch (error) {
      console.error("Admin login error:", error);

      let errorMessage = "Invalid credentials. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else if (error.message.includes("unauthorized") || error.message.includes("invalid")) {
          errorMessage = "Invalid email or password. Please check your credentials.";
        } else if (error.message.includes("account")) {
          errorMessage = "Account not found or access denied. Please contact system administrator.";
        } else {
          errorMessage = error.message;
        }
      }

      showErrorAlert("Admin Login Failed", errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.light.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-8">
          {/* Header */}
          <View className="items-center mb-10">
            <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-6">
              <Ionicons name="shield-checkmark" size={48} color="#3B82F6" />
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-3">Admin Portal</Text>
            <Text className="text-gray-600 text-center text-base leading-relaxed">
              Sign in to access the admin dashboard
            </Text>
          </View>

          {/* Login Form */}
          <View className="w-full max-w-sm mx-auto">
            {/* Email Input */}
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-3">Email Address</Text>
              <View className="relative">
                <TextInput
                  className="w-full px-4 py-4 pr-12 border border-gray-300 rounded-xl bg-white text-base"
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange("email", value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <View className="absolute right-4 top-4">
                  <Ionicons name="mail-outline" size={20} color={Colors.light.tabIconDefault} />
                </View>
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-8">
              <Text className="text-gray-700 font-semibold mb-3">Password</Text>
              <View className="relative">
                <TextInput
                  className="w-full px-4 py-4 pr-12 border border-gray-300 rounded-xl bg-white text-base"
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={formData.password}
                  onChangeText={(value) => handleInputChange("password", value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4"
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={Colors.light.tabIconDefault}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              className={`w-full py-4 rounded-xl items-center justify-center ${
                isLoading ? "bg-gray-400" : "bg-blue-600"
              }`}
              onPress={handleLogin}
              disabled={isLoading}
              style={{ minHeight: 56 }}
            >
              {isLoading ? (
                <View className="flex-row items-center">
                  <Text className="text-white font-semibold text-lg mr-2">Signing In</Text>
                  <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </View>
              ) : (
                <Text className="text-white font-semibold text-lg">Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Back to Role Selection */}
          <View className="mt-10 items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              disabled={isLoading}
              className="flex-row items-center py-3 px-4 rounded-lg"
            >
              <Ionicons name="arrow-back" size={20} color="#3B82F6" />
              <Text className="text-blue-600 font-medium ml-2 text-base">
                Back to Role Selection
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
