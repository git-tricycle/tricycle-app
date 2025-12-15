import React from "react";
import { TouchableOpacity, Platform, TouchableOpacityProps } from "react-native";

interface WebCompatibleTouchableOpacityProps extends TouchableOpacityProps {
  children: React.ReactNode;
}

/**
 * A web-compatible TouchableOpacity component that adds proper cursor styling
 * and other web-specific enhancements automatically.
 */
export const WebCompatibleTouchableOpacity: React.FC<WebCompatibleTouchableOpacityProps> = ({
  style,
  children,
  ...props
}) => {
  const webStyle =
    Platform.OS === "web"
      ? {
          cursor: "pointer",
          userSelect: "none" as any,
          // Add hover effects for web
          ":hover": {
            opacity: 0.8,
          },
          ...((style as any) || {}),
        }
      : style;

  return (
    <TouchableOpacity
      {...props}
      style={webStyle}
      activeOpacity={Platform.OS === "web" ? 0.8 : props.activeOpacity || 0.2}
    >
      {children}
    </TouchableOpacity>
  );
};

export default WebCompatibleTouchableOpacity;
