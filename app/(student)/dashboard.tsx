import { useAuth } from "@/src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StudentDashboard() {
  const { user, logout } = useAuth();

  const handleBookRide = () => {
    router.push("/(student)/book-ride");
  };

  const handleViewHistory = () => {
    router.push("/(student)/ride-history");
  };

  const handleProfile = () => {
    router.push("/(student)/profile");
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(onboarding)/welcome");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-black px-6 py-8 rounded-b-3xl mb-2">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white text-2xl font-bold">Good morning, {user?.firstName || "Student"}! 👋</Text>
            </View>
            <TouchableOpacity
              onPress={handleLogout}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            >
              <Ionicons name="log-out" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 -mt-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-black text-lg font-semibold mb-4">Quick Actions</Text>

            <TouchableOpacity onPress={handleBookRide} className="bg-black rounded-xl p-4 mb-4" activeOpacity={0.8}>
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4">
                  <Ionicons name="car" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-lg">Book a Ride</Text>
                  <Text className="text-white/80">Find a tricycle near you</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="white" />
              </View>
            </TouchableOpacity>

            <View className="flex-row space-x-4">
              <TouchableOpacity
                onPress={handleViewHistory}
                className="flex-1 bg-gray-100 rounded-xl p-4"
                activeOpacity={0.8}
              >
                <View className="items-center">
                  <Ionicons name="time" size={24} color="#000000" />
                  <Text className="text-black font-medium mt-2">History</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleProfile}
                className="flex-1 bg-gray-100 rounded-xl p-4"
                activeOpacity={0.8}
              >
                <View className="items-center">
                  <Ionicons name="person" size={24} color="#000000" />
                  <Text className="text-black font-medium mt-2">Profile</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View className="px-6 mt-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-black text-lg font-semibold mb-4">Recent Activity</Text>

            <View className="items-center py-8">
              <Ionicons name="car-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-4">No recent rides</Text>
              <Text className="text-gray-400 text-sm">Book your first ride to get started</Text>
            </View>
          </View>
        </View>

        {/* Safety Features */}
        <View className="px-6 mt-6 mb-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-black text-lg font-semibold mb-4">Safety Features</Text>

            <View className="space-y-3">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center mr-4">
                  <Ionicons name="alert-circle" size={20} color="#000000" />
                </View>
                <View className="flex-1">
                  <Text className="text-black font-medium">SOS Button</Text>
                  <Text className="text-gray-500 text-sm">Emergency alert system</Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center mr-4">
                  <Ionicons name="share" size={20} color="#000000" />
                </View>
                <View className="flex-1">
                  <Text className="text-black font-medium">Share Trip</Text>
                  <Text className="text-gray-500 text-sm">Share live location with contacts</Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center mr-4">
                  <Ionicons name="shield-checkmark" size={20} color="#000000" />
                </View>
                <View className="flex-1">
                  <Text className="text-black font-medium">Verified Drivers</Text>
                  <Text className="text-gray-500 text-sm">All drivers are background checked</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
