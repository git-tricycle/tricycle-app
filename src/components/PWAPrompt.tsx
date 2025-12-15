import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePWAInstall, useServiceWorker } from "@/src/hooks/usePWA";

export default function PWAPrompt() {
  const { isInstallable, install, isSupported } = usePWAInstall();
  const { updateAvailable, updateApp } = useServiceWorker();
  const [showPrompt, setShowPrompt] = useState(true);

  // Debug logging
  React.useEffect(() => {
    if (Platform.OS === "web") {
      console.log(
        "🎯 PWAPrompt mounted - isSupported:",
        isSupported,
        "isInstallable:",
        isInstallable
      );
    }
  }, [isSupported, isInstallable]);

  // Don't render on native platforms
  if (typeof window === "undefined" || !isSupported) {
    console.log("⏭️  Skipping PWAPrompt - window:", typeof window, "isSupported:", isSupported);
    return null;
  }

  // Show install prompt instead of update notification
  // Prioritize install prompt even when update is available
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
            onPress={() => {
              console.log("❌ User dismissed PWA install prompt");
              setShowPrompt(false);
            }}
            className="p-2"
            style={{ cursor: "pointer" }}
          >
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              console.log("✅ User clicked install button");
              install();
              setShowPrompt(false);
            }}
            className="bg-blue-500 px-4 py-2 rounded-lg ml-2"
            style={{ cursor: "pointer" }}
          >
            <Text className="text-white font-semibold text-center">Install</Text>
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
