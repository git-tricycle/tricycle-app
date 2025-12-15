import { Alert, Platform } from "react-native";

/**
 * Web-compatible alert utility
 * Shows native Alert on mobile and window.alert on web
 */
export const showAlert = (title: string, message?: string) => {
  if (Platform.OS === "web") {
    window.alert(`${title}${message ? `\n${message}` : ""}`);
  } else {
    Alert.alert(title, message);
  }
};

/**
 * Web-compatible confirmation dialog
 * Shows native Alert with buttons on mobile and window.confirm on web
 */
export const showConfirm = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n${message}`)) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
  } else {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: onCancel },
      { text: "OK", onPress: onConfirm },
    ]);
  }
};

/**
 * Success alert with positive styling
 */
export const showSuccessAlert = (title: string, message?: string) => {
  showAlert(`✓ ${title}`, message);
};

/**
 * Error alert with error styling
 */
export const showErrorAlert = (title: string, message?: string) => {
  showAlert(`✗ ${title}`, message);
};

/**
 * Warning confirmation dialog
 */
export const showWarningConfirm = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  confirmText: string = "OK",
  cancelText: string = "Cancel"
) => {
  if (Platform.OS === "web") {
    if (window.confirm(`⚠️ ${title}\n${message}`)) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
  } else {
    Alert.alert(`⚠️ ${title}`, message, [
      { text: cancelText, style: "cancel", onPress: onCancel },
      { text: confirmText, style: "destructive", onPress: onConfirm },
    ]);
  }
};

/**
 * Destructive action confirmation (delete, ban, etc.)
 */
export const showDestructiveConfirm = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  confirmText: string = "Delete"
) => {
  showWarningConfirm(title, message, onConfirm, onCancel, confirmText, "Cancel");
};
