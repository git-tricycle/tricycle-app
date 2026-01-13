// API Configuration for different environments and devices
export const API_CONFIG = {
  // Development configurations
  ANDROID_EMULATOR: "http://10.0.2.2:5000/api",
  IOS_SIMULATOR: "http://localhost:5000/api",
  PHYSICAL_DEVICE: "http://192.168.1.35:5000/api", // Your computer's IP address
  EXPO_TUNNEL: "https://your-tunnel-url.ngrok.io/api", // If using ngrok or similar

  // Production
  PRODUCTION: "https://tricycle-api-d5e16195c414.herokuapp.com/api",
};

// Auto-detect the best configuration
export const getApiBaseUrl = (): string => {
  // if (__DEV__) {
  //   // Since you're using exp://192.168.1.6:8081, you're likely on a physical device
  //   // or using the network interface, so we'll use the physical device config
  //   return API_CONFIG.PHYSICAL_DEVICE; // Using your network IP
  // }

  return API_CONFIG.PRODUCTION;
};

// Network timeout configuration
export const NETWORK_CONFIG = {
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};
