import React from "react";
import { Modal, Platform, ModalProps } from "react-native";

interface WebCompatibleModalProps extends ModalProps {
  children: React.ReactNode;
}

/**
 * A web-compatible Modal component that handles platform-specific styling
 * and properties automatically.
 */
export const WebCompatibleModal: React.FC<WebCompatibleModalProps> = ({
  style,
  presentationStyle,
  transparent,
  children,
  ...props
}) => {
  const webStyle =
    Platform.OS === "web"
      ? {
          position: "fixed" as any,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          backgroundColor: transparent ? "rgba(0,0,0,0.5)" : "white",
          display: "flex",
          alignItems: presentationStyle === "fullScreen" ? "stretch" : "center",
          justifyContent: presentationStyle === "fullScreen" ? "stretch" : "center",
          ...((style as any) || {}),
        }
      : style;

  const webPresentationStyle = Platform.OS === "web" ? undefined : presentationStyle;
  const webTransparent = Platform.OS === "web" ? false : transparent;

  return (
    <Modal
      {...props}
      style={webStyle}
      presentationStyle={webPresentationStyle}
      transparent={webTransparent}
    >
      {children}
    </Modal>
  );
};

export default WebCompatibleModal;
