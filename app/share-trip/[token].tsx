import React from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import SharedTripTracker from "@/src/components/SharedTripTracker";

export default function ShareTripPage() {
  const { token } = useLocalSearchParams();
  const shareToken = Array.isArray(token) ? token[0] : token;

  console.log("ShareTripPage loaded with token:", shareToken);

  if (!shareToken || shareToken.trim() === "") {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-base text-gray-600 mb-2">
            Invalid share link
          </Text>
          <Text className="text-sm text-gray-500">Token: {String(token)}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <SharedTripTracker shareToken={shareToken} />
    </SafeAreaView>
  );
}
