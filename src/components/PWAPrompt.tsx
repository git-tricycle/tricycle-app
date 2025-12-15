import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePWAInstall, useServiceWorker } from "@/src/hooks/usePWA";

export default function PWAPrompt() {
  const { isInstallable, install, isSupported } = usePWAInstall();
  const { updateAvailable, updateApp } = useServiceWorker();
  const [showPrompt, setShowPrompt] = useState(true);

  // Don't render on native platforms
  if (Platform.OS !== "web" || !isSupported) {
    return null;
  }

  // Show update prompt if update is available
  if (updateAvailable) {
    return (
      <View className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-3 z-50 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Ionicons name="download" size={20} color="white" />
          <Text className="text-white ml-2 flex-1">A new version is available!</Text>
        </View>
        <TouchableOpacity
          onPress={updateApp}
          className="bg-white bg-opacity-20 px-3 py-1 rounded"
          style={{ cursor: "pointer" }}
        >
          <Text className="text-white font-medium">Update</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show install prompt if app is installable and user hasn't dismissed it
  if (isInstallable && showPrompt) {
    return (
      <View className="fixed bottom-4 left-4 right-4 bg-black text-white p-4 rounded-xl shadow-lg z-50 flex-row items-center justify-between max-w-md mx-auto">
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 bg-white bg-opacity-20 rounded-full items-center justify-center mr-3">
            <Ionicons name="download" size={20} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold">Install Ride It!</Text>
            <Text className="text-gray-300 text-sm">Install our app for a better experience</Text>
          </View>
        </View>
        <View className="flex-row items-center ml-3">
          <TouchableOpacity
            onPress={() => setShowPrompt(false)}
            className="p-2"
            style={{ cursor: "pointer" }}
          >
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              install();
              setShowPrompt(false);
            }}
            className="bg-white px-3 py-2 rounded-lg ml-2"
            style={{ cursor: "pointer" }}
          >
            <Text className="text-black font-semibold">Install</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

// Install button component for settings or other pages
export function PWAInstallButton({
  className = "",
  onInstall,
}: {
  className?: string;
  onInstall?: () => void;
}) {
  const { isInstallable, install, isSupported, isInstalled } = usePWAInstall();

  if (Platform.OS !== "web" || !isSupported || isInstalled || !isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    await install();
    onInstall?.();
  };

  return (
    <TouchableOpacity
      onPress={handleInstall}
      className={`flex-row items-center bg-black px-4 py-3 rounded-xl ${className}`}
      style={{ cursor: "pointer" }}
    >
      <Ionicons name="download" size={20} color="white" />
      <Text className="text-white font-semibold ml-2">Install App</Text>
    </TouchableOpacity>
  );
}
