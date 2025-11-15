import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RoleSelectionScreen() {
  const handleStudentSelect = () => {
    router.push("/(auth)/student-login");
  };

  const handleDriverSelect = () => {
    router.push("/(auth)/driver-login");
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4">
        <TouchableOpacity onPress={handleBack} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1 justify-center items-center px-6">
        {/* Logo */}
        <View className="w-32 h-32 bg-black rounded-full items-center justify-center mb-8">
          <Image
            source={require("@/assets/images/tricycle-logo.gif")}
            className="w-24 h-24"
            resizeMode="contain"
            tintColor="white"
          />
        </View>

        {/* Title */}
        <Text className="text-3xl font-bold text-black text-center mb-4">Choose Your Role</Text>

        <Text className="text-lg text-gray-600 text-center mb-12">
          Select how you want to use Ride It
        </Text>

        {/* Role Options */}
        <View className="w-full space-y-4">
          {/* Student Option */}
          <TouchableOpacity
            onPress={handleStudentSelect}
            className="w-full bg-black rounded-2xl p-6 border-2 border-black mb-3"
            activeOpacity={0.8}
          >
            <View className="flex-row items-center">
              <View className="w-16 h-16 bg-gray-800 rounded-full items-center justify-center mr-4">
                <Ionicons name="school" size={32} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-xl mb-1">I&apos;m a Student</Text>
                <Text className="text-gray-300 text-base">Book rides to and from school</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </View>
          </TouchableOpacity>

          {/* Driver Option */}
          <TouchableOpacity
            onPress={handleDriverSelect}
            className="w-full bg-white rounded-2xl p-6 border-2 border-black"
            activeOpacity={0.8}
          >
            <View className="flex-row items-center">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="car" size={32} color="black" />
              </View>
              <View className="flex-1">
                <Text className="text-black font-bold text-xl mb-1">I&apos;m a Driver</Text>
                <Text className="text-gray-600 text-base">Provide tricycle rides and earn</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="black" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text className="text-gray-500 text-center mt-12 leading-6">
          You can always change your role later in the settings
        </Text>
      </View>
    </SafeAreaView>
  );
}
