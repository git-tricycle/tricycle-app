import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-2xl font-bold text-gray-900 mb-4">Student Profile</Text>
        <Text className="text-gray-600 text-center">
          This screen will contain the student's profile information and settings.
        </Text>
      </View>
    </SafeAreaView>
  );
}
