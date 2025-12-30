import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type AlertType = "success" | "error" | "info" | "warning";

export interface AlertModalProps {
  visible: boolean;
  type: AlertType;
  title: string;
  message?: string;
  onClose: () => void;
  buttonText?: string;
}

const alertConfig = {
  success: {
    icon: "checkmark-circle" as const,
    iconColor: "#22C55E",
    backgroundColor: "#DCFCE7",
    buttonColor: "#22C55E",
  },
  error: {
    icon: "close-circle" as const,
    iconColor: "#EF4444",
    backgroundColor: "#FEE2E2",
    buttonColor: "#EF4444",
  },
  warning: {
    icon: "warning" as const,
    iconColor: "#F59E0B",
    backgroundColor: "#FEF3C7",
    buttonColor: "#F59E0B",
  },
  info: {
    icon: "information-circle" as const,
    iconColor: "#3B82F6",
    backgroundColor: "#DBEAFE",
    buttonColor: "#3B82F6",
  },
};

export function AlertModal({
  visible,
  type,
  title,
  message,
  onClose,
  buttonText = "OK",
}: AlertModalProps) {
  const config = alertConfig[type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: config.backgroundColor }]}>
            <Ionicons name={config.icon} size={48} color={config.iconColor} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          {message && <Text style={styles.message}>{message}</Text>}

          {/* Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: config.buttonColor }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
      },
    }),
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
