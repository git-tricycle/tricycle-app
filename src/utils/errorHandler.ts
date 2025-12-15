// Global error handler for production builds
import { ErrorUtils } from "react-native";

export function setupGlobalErrorHandler() {
  // Handle JavaScript errors
  const defaultHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error("Global error handler:", error, "isFatal:", isFatal);

    // Log the error for debugging
    if (__DEV__) {
      console.log("Error stack:", error.stack);
    }

    // Call the default handler
    if (defaultHandler) {
      defaultHandler(error, isFatal);
    }
  });

  // Handle promise rejections
  const promiseRejectionHandler = (event: any) => {
    console.error("Unhandled promise rejection:", event.reason);
  };

  if (typeof global !== "undefined") {
    // @ts-ignore
    global.onunhandledrejection = promiseRejectionHandler;
  }

  console.log("Global error handler installed");
}
