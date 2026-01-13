import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import "../global.css";
import { View, Text, Platform } from "react-native";

import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { AuthProvider } from "@/src/contexts/AuthContext";
import PWAPrompt from "@/src/components/PWAPrompt";
import { useServiceWorker } from "@/src/hooks/usePWA";
import { initPWA } from "@/src/lib/pwa-init";

console.log("🚀 App starting...");

// Initialize PWA on app load
if (typeof window !== "undefined") {
  initPWA();
}

// Safely hide splash screen
const hideSplash = async () => {
  try {
    await SplashScreen.hideAsync();
  } catch (e) {
    console.log("Splash screen already hidden");
  }
};

// Prevent auto-hide
try {
  SplashScreen.preventAutoHideAsync().catch(() => {});
} catch (e) {
  console.log("Could not prevent auto hide");
}

export const unstable_settings = {
  initialRouteName: "(onboarding)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    "Poppins-Light": require("@/assets/fonts/Poppins-Light.ttf"),
    "Poppins-Regular": require("@/assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("@/assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("@/assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("@/assets/fonts/Poppins-Bold.ttf"),
    "Poppins-ExtraBold": require("@/assets/fonts/Poppins-ExtraBold.ttf"),
    "Poppins-Black": require("@/assets/fonts/Poppins-Black.ttf"),
  });

  // Register service worker on web
  useServiceWorker();

  useEffect(() => {
    // Hide splash when fonts are ready OR after 1 second (whichever comes first)
    const timer = setTimeout(() => {
      hideSplash();
    }, 1000);

    if (fontsLoaded) {
      hideSplash();
      clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(student)" />
          <Stack.Screen name="(driver)" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <StatusBar style="auto" />
        {Platform.OS === "web" && <PWAPrompt />}
      </ThemeProvider>
    </AuthProvider>
  );
}
