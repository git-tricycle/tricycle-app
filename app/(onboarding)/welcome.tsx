import { router } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const handleGetStarted = () => {
    router.push("/(onboarding)/slide1");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-6">
        <View className="items-center mb-12">
          {/* App Logo */}
          <View className="w-32 h-32 bg-black rounded-full items-center justify-center mb-8">
            <Image
              source={require("@/assets/images/tricycle-logo.gif")}
              style={{
                width: 80,
                height: 80,
                tintColor: "white",
                maxWidth: "100%",
                maxHeight: "100%",
                ...(Platform.OS === "web" && {
                  filter: "grayscale(100%)",
                }),
              }}
              resizeMode="contain"
            />
          </View>

          {/* App Title */}
          <Text className="text-4xl font-bold text-black text-center mb-4">
            Welcome to Ride It!
          </Text>

          {/* Tagline */}
          <Text className="text-lg text-gray-600 text-center leading-6">
            Your trusted tricycle booking companion for safe and convenient rides
          </Text>
        </View>

        {/* Get Started Button */}
        <TouchableOpacity
          onPress={handleGetStarted}
          className="bg-black rounded-full px-12 py-4 border-2 border-black"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-lg">Get Started</Text>
        </TouchableOpacity>

        {/* Skip Option */}
        <TouchableOpacity
          onPress={() => router.push("/(onboarding)/role-selection")}
          className="mt-6"
          activeOpacity={0.7}
        >
          <Text className="text-gray-600 text-base">Skip Introduction</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
