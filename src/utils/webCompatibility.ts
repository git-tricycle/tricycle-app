import { Platform, ImageSourcePropType } from "react-native";

/**
 * Helper function to resolve image sources for web compatibility
 * @param source - The require() image source
 * @returns Web-compatible image source
 */
export const getWebCompatibleImageSource = (source: any): ImageSourcePropType => {
  if (Platform.OS === "web") {
    try {
      // Handle webpack-processed images that have .default property
      return { uri: source.default || source };
    } catch (error) {
      return source;
    }
  }
  return source;
};

/**
 * Get platform-specific image style for web compatibility
 * @param webWidth - Width for web platform
 * @param webHeight - Height for web platform
 * @param additionalStyles - Additional styles to apply
 * @returns Platform-specific styles
 */
export const getWebCompatibleImageStyle = (
  webWidth?: number,
  webHeight?: number,
  additionalStyles?: any
) => {
  if (Platform.OS === "web") {
    return {
      width: webWidth,
      height: webHeight,
      maxWidth: "100%",
      maxHeight: "100%",
      ...additionalStyles,
    };
  }
  return additionalStyles;
};

/**
 * Get platform-specific className for images
 * @param webClassName - Class name for web (empty string recommended)
 * @param nativeClassName - Class name for native platforms
 * @returns Platform-specific className
 */
export const getWebCompatibleImageClassName = (
  webClassName: string = "",
  nativeClassName: string
) => {
  return Platform.OS === "web" ? webClassName : nativeClassName;
};
