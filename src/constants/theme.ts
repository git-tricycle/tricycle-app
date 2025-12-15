/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

// Black and White Color Palette
const tintColorLight = "#000000"; // Black
const tintColorDark = "#ffffff"; // White

export const Colors = {
  light: {
    text: "#000000", // Black text
    background: "#ffffff", // White background
    tint: tintColorLight, // Black tint
    icon: "#6b7280", // Medium gray icons
    tabIconDefault: "#9ca3af", // Light gray for inactive tabs
    tabIconSelected: tintColorLight, // Black for active tabs
    border: "#e5e7eb", // Light gray borders
    muted: "#f3f4f6", // Very light gray for muted elements
  },
  dark: {
    text: "#ffffff", // White text
    background: "#000000", // Black background
    tint: tintColorDark, // White tint
    icon: "#9ca3af", // Light gray icons
    tabIconDefault: "#6b7280", // Medium gray for inactive tabs
    tabIconSelected: tintColorDark, // White for active tabs
    border: "#374151", // Dark gray borders
    muted: "#1f2937", // Very dark gray for muted elements
  },
};

// Semantic Colors (Black & White Theme)
export const SemanticColors = {
  success: "#000000", // Black for success states
  error: "#374151", // Dark gray for errors (softer than pure black)
  warning: "#6b7280", // Medium gray for warnings
  info: "#9ca3af", // Light gray for info

  // Background variations
  backgroundPrimary: "#ffffff", // Pure white
  backgroundSecondary: "#f9fafb", // Very light gray
  backgroundTertiary: "#f3f4f6", // Light gray

  // Text variations
  textPrimary: "#000000", // Pure black
  textSecondary: "#374151", // Dark gray
  textTertiary: "#6b7280", // Medium gray
  textMuted: "#9ca3af", // Light gray

  // Border variations
  borderPrimary: "#e5e7eb", // Light gray
  borderSecondary: "#d1d5db", // Medium light gray
  borderAccent: "#000000", // Black for emphasis
};

// Poppins Font Family (Local Files)
export const FontFamily = {
  light: "Poppins-Light",
  regular: "Poppins-Regular",
  medium: "Poppins-Medium",
  semiBold: "Poppins-SemiBold",
  bold: "Poppins-Bold",
  extraBold: "Poppins-ExtraBold",
  black: "Poppins-Black",
} as const;

export const Fonts = Platform.select({
  ios: {
    /** Poppins as primary font family */
    sans: FontFamily.regular,
    serif: FontFamily.regular,
    rounded: FontFamily.medium,
    mono: "Menlo",
  },
  android: {
    sans: FontFamily.regular,
    serif: FontFamily.regular,
    rounded: FontFamily.medium,
    mono: "monospace",
  },
  default: {
    sans: FontFamily.regular,
    serif: FontFamily.regular,
    rounded: FontFamily.medium,
    mono: "monospace",
  },
  web: {
    sans: `${FontFamily.regular}, 'Poppins', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`,
    serif: `${FontFamily.regular}, 'Poppins', Georgia, 'Times New Roman', serif`,
    rounded: `${FontFamily.medium}, 'Poppins', 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif`,
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
