import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EarningsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-2xl font-bold text-gray-900 mb-4">Earnings</Text>
        <Text className="text-gray-600 text-center">
          This screen will display driver earnings, payment history, and financial reports.
        </Text>
      </View>
    </SafeAreaView>
  );
}
