import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Slide1Screen() {
  const handleNext = () => {
    router.push("/(onboarding)/slide2");
  };

  const handleBack = () => {
    router.back();
  };

  const handleSkip = () => {
    router.push("/(onboarding)/role-selection");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
        <TouchableOpacity onPress={handleBack} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkip}>
          <Text className="text-gray-600 font-medium">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View className="flex-row justify-center mb-8">
        <View className="flex-row space-x-2">
          <View className="w-8 h-2 bg-black rounded-full" />
          <View className="w-2 h-2 bg-gray-300 rounded-full" />
          <View className="w-2 h-2 bg-gray-300 rounded-full" />
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 justify-center items-center px-6">
        {/* Illustration */}
        <View className="w-80 h-80 bg-gray-100 rounded-3xl items-center justify-center mb-12">
          <Image
            source={require("@/assets/images/Directions.png")}
            className="w-80 h-80"
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text className="text-3xl font-bold text-black text-center mb-6">Book your Tricycle with ease</Text>

        {/* Description */}
        <Text className="text-lg text-gray-600 text-center leading-7 mb-12">
          Find and book available tricycles in your area with just a few taps. Quick, reliable, and convenient
          transportation at your fingertips.
        </Text>
      </View>

      {/* Navigation */}
      <View className="px-6 pb-8">
        <TouchableOpacity
          onPress={handleNext}
          className="bg-black rounded-full py-4 items-center border-2 border-black"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-lg">Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
