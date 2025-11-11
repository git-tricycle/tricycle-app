import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Slide3Screen() {
  const handleGetStarted = () => {
    router.push('/(onboarding)/role-selection');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
        <TouchableOpacity onPress={handleBack} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <View className="w-12" />
      </View>

      {/* Progress Indicator */}
      <View className="flex-row justify-center mb-8">
        <View className="flex-row space-x-2">
          <View className="w-2 h-2 bg-gray-300 rounded-full" />
          <View className="w-2 h-2 bg-gray-300 rounded-full" />
          <View className="w-8 h-2 bg-black rounded-full" />
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 justify-center items-center px-6">
        {/* Illustration */}
        <View className="w-80 h-80 bg-gray-100 rounded-3xl items-center justify-center mb-12">
          <View className="items-center">
            <Ionicons name="shield-checkmark" size={80} color="#000000" />
            <View className="mt-4 flex-row items-center space-x-2">
              <Ionicons name="star" size={20} color="#000000" />
              <Ionicons name="star" size={20} color="#000000" />
              <Ionicons name="star" size={20} color="#000000" />
              <Ionicons name="star" size={20} color="#000000" />
              <Ionicons name="star" size={20} color="#000000" />
            </View>
          </View>
        </View>

        {/* Title */}
        <Text className="text-3xl font-bold text-black text-center mb-6">
          Safe & Reliable Service
        </Text>

        {/* Description */}
        <Text className="text-lg text-gray-600 text-center leading-7 mb-12">
          All our drivers are verified and rated by the community. 
          Track your ride in real-time and enjoy peace of mind with every journey.
        </Text>
      </View>

      {/* Navigation */}
      <View className="px-6 pb-8">
        <TouchableOpacity
          onPress={handleGetStarted}
          className="bg-black rounded-full py-4 items-center border-2 border-black"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold text-lg">Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
