import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { useConfirm } from "@/src/hooks/useConfirm";
import { Colors } from "@/src/constants/theme";
import { PWAInstallButton } from "@/src/components/PWAPrompt";

// Web compatibility utilities
const showAlert = (title: string, message?: string) => {
  if (Platform.OS === "web") {
    window.alert(`${title}${message ? `\n${message}` : ""}`);
  } else {
    Alert.alert(title, message);
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

export default function AdminSettingsScreen() {
  const { user, logout } = useAuth();
  const { showConfirm, ConfirmModalComponent } = useConfirm();

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      title: "Logout",
      message: "Are you sure you want to logout?",
      icon: "log-out",
      confirmText: "Logout",
    });

    if (confirmed) {
      try {
        await logout();
        // Navigate back to onboarding after logout
        router.replace("/(onboarding)/role-selection");
      } catch (error) {
        console.error("Logout error:", error);
        // Even if logout fails, navigate away for security
        router.replace("/(onboarding)/role-selection");
      }
    }
  };

  const SettingsItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    textColor = "text-gray-900",
    iconColor = Colors.light.tint,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
    textColor?: string;
    iconColor?: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      {...getWebButtonStyle(
        "bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100 flex-row items-center"
      )}
    >
      <View
        className="w-10 h-10 rounded-lg items-center justify-center mr-4"
        style={{ backgroundColor: iconColor + "20" }}
      >
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className={`font-semibold ${textColor}`}>{title}</Text>
        {subtitle && <Text className="text-gray-600 text-sm mt-1">{subtitle}</Text>}
      </View>
      {showArrow && <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Settings</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Profile Section */}
        <View className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
          <View className="flex-row items-center">
            <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mr-4">
              <Ionicons name="person" size={32} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">
                {user?.firstName} {user?.lastName}
              </Text>
              <Text className="text-gray-600">{user?.email}</Text>
              <View className="flex-row items-center mt-1">
                <View className="px-2 py-1 bg-red-100 rounded-full">
                  <Text className="text-red-700 text-xs font-medium uppercase">Admin</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* System Settings */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">System Settings</Text>

          <SettingsItem
            icon="calculator"
            title="Fare Management"
            subtitle="Configure base fare and rates"
            onPress={() => router.push("/(admin)/fare-management")}
          />

          <SettingsItem
            icon="people"
            title="User Management"
            subtitle="Manage users and permissions"
            onPress={() => router.push("/(admin)/users")}
          />
        </View>

        {/* App Settings */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">App Settings</Text>

          <SettingsItem
            icon="globe"
            title="System Information"
            subtitle="View app version and system details"
            onPress={() => showAlert("System Info", "Tricycle Admin App v1.0.0\nBuild: 2024.11.18")}
          />

          {Platform.OS === "web" && <PWAInstallButton />}

          <SettingsItem
            icon="help-circle"
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={() =>
              showAlert(
                "Help & Support",
                "Need assistance?\n\n• Email: tricycle.book.app@gmail.com\n• Hotline: +63 912 345 6789\n• Hours: Mon–Fri, 8am–6pm\n\nOur support team will respond within 24 hours."
              )
            }
          />

          <SettingsItem
            icon="document-text"
            title="Terms & Privacy"
            subtitle="View terms of service and privacy policy"
            onPress={() =>
              showAlert(
                "Terms & Privacy",
                "Usage of the Tricycle Admin Dashboard is governed by our Terms of Service and Privacy Policy.\n\n• We collect admin profile information to keep accounts secure.\n• Ride and fare data are stored securely in our cloud infrastructure.\n• Access is restricted to authorized personnel only."
              )
            }
          />
        </View>

        {/* Danger Zone */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Account</Text>

          <SettingsItem
            icon="log-out"
            title="Logout"
            subtitle="Sign out of your admin account"
            onPress={handleLogout}
            showArrow={false}
            textColor="text-red-600"
            iconColor="#EF4444"
          />
        </View>

        {/* Footer */}
        <View className="items-center py-8">
          <Text className="text-gray-500 text-sm">Tricycle Admin Dashboard</Text>
          <Text className="text-gray-400 text-xs mt-1">Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <ConfirmModalComponent />
    </SafeAreaView>
  );
}
