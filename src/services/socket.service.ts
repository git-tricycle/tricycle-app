import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface LocationUpdate {
  latitude: number;
  longitude: number;
  timestamp: Date;
}

interface RideLocationUpdate {
  rideId: string;
  location: LocationUpdate;
}

interface RideStatusUpdate {
  rideId: string;
  status: string;
  timestamp: Date;
  driver?: {
    id: string;
    name: string;
  };
}

type SocketEventCallback = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private eventListeners: Map<string, Set<SocketEventCallback>> = new Map();

  /**
   * Initialize and connect to Socket.IO server
   */
  async connect(): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      console.log("Socket already connected or connecting");
      return;
    }

    this.isConnecting = true;

    try {
      // Get authentication token
      const token = await AsyncStorage.getItem("authToken");

      // Determine the API URL
      const API_URL =
        process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";
      const socketUrl = API_URL.replace(/\/api$/, ""); // Remove /api if present

      console.log("Connecting to Socket.IO server:", socketUrl);

      // Create socket connection
      this.socket = io(socketUrl, {
        transports: ["websocket", "polling"],
        auth: {
          token: token || undefined,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 10000,
      });

      // Setup event handlers
      this.setupEventHandlers();

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Socket connection timeout"));
        }, 10000);

        this.socket?.once("connect", () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          console.log("Socket connected:", this.socket?.id);
          resolve();
        });

        this.socket?.once("connect_error", (error) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          console.error("Socket connection error:", error);
          reject(error);
        });
      });
    } catch (error) {
      this.isConnecting = false;
      console.error("Failed to connect to Socket.IO:", error);
      throw error;
    }
  }

  /**
   * Connect using a share token (for public trip tracking)
   */
  async connectWithShareToken(shareToken: string): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      console.log("Socket already connected or connecting");
      return;
    }

    this.isConnecting = true;

    try {
      const API_URL =
        process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";
      const socketUrl = API_URL.replace(/\/api$/, "");

      console.log("Connecting to Socket.IO server with share token");

      this.socket = io(socketUrl, {
        transports: ["websocket", "polling"],
        auth: {
          shareToken,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.setupEventHandlers();

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Socket connection timeout"));
        }, 10000);

        this.socket?.once("connect", () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          console.log("Socket connected with share token:", this.socket?.id);
          resolve();
        });

        this.socket?.once("connect_error", (error) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          console.error("Socket connection error:", error);
          reject(error);
        });
      });
    } catch (error) {
      this.isConnecting = false;
      console.error("Failed to connect to Socket.IO:", error);
      throw error;
    }
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Socket.IO connected:", this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket.IO disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
      this.reconnectAttempts++;
    });

    this.socket.on("error", (error) => {
      console.error("Socket.IO error:", error);
      this.notifyListeners("error", error);
    });

    // New ride request notifications (for drivers)
    this.socket.on("ride:new", (data: any) => {
      console.log("Received new ride request:", data);
      this.notifyListeners("ride:new", data);
    });

    // Ride location updates
    this.socket.on("ride:location:update", (data: RideLocationUpdate) => {
      console.log("Received location update:", data);
      this.notifyListeners("ride:location:update", data);
    });

    // Ride status updates
    this.socket.on("ride:status:update", (data: RideStatusUpdate) => {
      console.log("Received status update:", data);
      this.notifyListeners("ride:status:update", data);
    });

    // Room join confirmations
    this.socket.on("ride:joined", (data) => {
      console.log("Joined ride room:", data);
      this.notifyListeners("ride:joined", data);
    });

    this.socket.on("share:joined", (data) => {
      console.log("Joined share room:", data);
      this.notifyListeners("share:joined", data);
    });

    this.socket.on("driver:joined", (data) => {
      console.log("Joined driver room:", data);
      this.notifyListeners("driver:joined", data);
    });

    // Location update confirmation for drivers
    this.socket.on("driver:location:updated", (data) => {
      console.log("Driver location updated:", data);
      this.notifyListeners("driver:location:updated", data);
    });
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.socket) {
      console.log("Disconnecting socket");
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventListeners.clear();
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Join a ride room to receive real-time updates
   */
  joinRide(rideId: string): void {
    if (!this.socket?.connected) {
      console.warn("Socket not connected, cannot join ride");
      return;
    }

    console.log("Joining ride room:", rideId);
    this.socket.emit("ride:join", { rideId });
  }

  /**
   * Join using a share token
   */
  joinWithShareToken(shareToken: string): void {
    if (!this.socket?.connected) {
      console.warn("Socket not connected, cannot join with share token");
      return;
    }

    console.log("Joining with share token");
    this.socket.emit("share:join", { shareToken });
  }

  /**
   * Leave a ride room
   */
  leaveRide(rideId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    console.log("Leaving ride room:", rideId);
    this.socket.emit("ride:leave", { rideId });
  }

  /**
   * Update driver location (only for drivers)
   */
  updateDriverLocation(location: LocationUpdate): void {
    if (!this.socket?.connected) {
      console.warn("Socket not connected, cannot update location");
      return;
    }

    this.socket.emit("driver:location:update", location);
  }

  /**
   * Join driver room (only for drivers)
   */
  joinDriverRoom(driverId: string): void {
    if (!this.socket?.connected) {
      console.warn("Socket not connected, cannot join driver room");
      return;
    }

    console.log("Joining driver room:", driverId);
    this.socket.emit("driver:join", { driverId });
  }

  /**
   * Subscribe to a socket event
   */
  on(event: string, callback: SocketEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback);
  }

  /**
   * Unsubscribe from a socket event
   */
  off(event: string, callback: SocketEventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  /**
   * Notify all listeners of an event
   */
  private notifyListeners(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Emit a custom event
   */
  emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      console.warn("Socket not connected, cannot emit event");
      return;
    }

    this.socket.emit(event, data);
  }
}

// Export singleton instance
const socketService = new SocketService();

export default socketService;

export type {
  LocationUpdate,
  RideLocationUpdate,
  RideStatusUpdate,
  SocketEventCallback,
};
