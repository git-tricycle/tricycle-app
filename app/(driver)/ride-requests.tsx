import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { rideService, type Ride } from "@/src/services/ride.service";
import { driverService } from "@/src/services/driver.service";
import socketService from "@/src/services/socket.service";
import MapView, {
  type Location,
  type MapPolyline,
} from "@/src/components/ui/MapView";
import * as ExpoLocation from "expo-location";
import { getRouteBetween } from "@/src/services/directions.service";
import { AlertModal, type AlertType } from "@/src/components/AlertModal";
import { ConfirmModal } from "@/src/components/ConfirmModal";

interface RideRequest extends Ride {
  estimatedTime?: number;
  distance?: number;
}

export default function RideRequestsScreen() {
  const { user } = useAuth();
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingRideId, setProcessingRideId] = useState<string | null>(null);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [isActiveRideVisible, setIsActiveRideVisible] = useState(false);

  // Alert modal state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    onClose: () => void;
  }>({
    visible: false,
    type: "info",
    title: "",
    message: "",
    onClose: () => {},
  });

  // Confirmation modal state for accept ride
  const [confirmConfig, setConfirmConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    visible: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const showAlert = (
    title: string,
    message: string,
    type: AlertType = "info",
  ) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      onClose: () => setAlertConfig((prev) => ({ ...prev, visible: false })),
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
  ) => {
    setConfirmConfig({
      visible: true,
      title,
      message,
      onConfirm: () => {
        setConfirmConfig((prev) => ({ ...prev, visible: false }));
        onConfirm();
      },
      onCancel: () => {
        setConfirmConfig((prev) => ({ ...prev, visible: false }));
        onCancel?.();
      },
    });
  };
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const driverLocationRef = useRef<Location | null>(null);
  const [isRideStatusUpdating, setIsRideStatusUpdating] = useState(false);
  const locationWatcher = useRef<ExpoLocation.LocationSubscription | null>(
    null,
  );

  const [routePolylines, setRoutePolylines] = useState<MapPolyline[]>([]);
  const lastRouteKeyRef = useRef<string | null>(null);
  const [newRideNotification, setNewRideNotification] =
    useState<RideRequest | null>(null);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const previousRideCountRef = useRef<number>(0);

  useEffect(() => {
    // Initialize Socket.IO connection
    const initializeSocket = async () => {
      try {
        if (!socketService.isConnected()) {
          await socketService.connect();
        }

        // Join driver room for real-time notifications
        if (user?.id) {
          socketService.joinDriverRoom(user.id);
        }
      } catch (error) {
        console.error("Failed to initialize socket connection:", error);
      }
    };

    initializeSocket();
    loadRideRequests();
    getCurrentLocation(); // Get current GPS location on mount

    // Socket.IO real-time updates
    const handleNewRideRequest = (data: any) => {
      console.log("New ride request received:", data);

      // Show notification
      if (data.ride) {
        setNewRideNotification(data.ride);
        setIsNotificationVisible(true);

        // Auto-hide notification after 10 seconds
        setTimeout(() => {
          setIsNotificationVisible(false);
        }, 10000);
      }

      // Refresh ride list
      loadRideRequests(false);
    };

    const handleRideStatusUpdate = (data: any) => {
      if (activeRide && data.rideId === activeRide.id) {
        // Update active ride status in real-time
        if (data.status === "cancelled") {
          setActiveRide(null);
          setIsActiveRideVisible(false);
          showAlert(
            "Ride Cancelled",
            "The passenger has cancelled this ride request.",
            "warning",
          );
          loadRideRequests(false);
        } else {
          setActiveRide((prev) =>
            prev ? { ...prev, status: data.status } : null,
          );
        }
      } else {
        // Status update for a ride in the list
        loadRideRequests(false);
      }
    };

    // Subscribe to socket events
    socketService.on("ride:new", handleNewRideRequest);
    socketService.on("ride:status:update", handleRideStatusUpdate);

    // Minimal fallback polling only every 60 seconds
    const fallbackInterval = setInterval(() => {
      if (!isActiveRideVisible) {
        loadRideRequests(false);
      }
    }, 60000);

    return () => {
      socketService.off("ride:new", handleNewRideRequest);
      socketService.off("ride:status:update", handleRideStatusUpdate);
      clearInterval(fallbackInterval);
    };
  }, [isActiveRideVisible, activeRide?.id, activeRide?.status, user?.id]);

  const loadRideRequests = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setIsRefreshing(true);

      // Get all pending rides only (exclude cancelled rides)
      const response = await rideService.getRides({
        status: "pending",
        limit: 20,
        page: 1,
        fields:
          "id,pickup,dropoff,fare,paymentMode,status,createdAt,passenger.firstName,passenger.lastName,passenger.email,location.latitude,location.longitude",
      });

      // Double check: filter out any cancelled rides just in case
      const filteredRides =
        response.data?.filter((ride) => ride.status === "pending") || [];

      if (response.success && filteredRides.length > 0) {
        // Calculate estimated time and distance for each ride based on coordinates
        const requestsWithEstimates = filteredRides.map((ride) => {
          // Calculate distance using Haversine formula
          const distance = calculateDistance(
            {
              latitude: ride.location?.latitude || 0,
              longitude: ride.location?.longitude || 0,
            },
            driverLocation || { latitude: 13.92077, longitude: 122.09891 }, // Use current GPS location or default
          );

          // Calculate ETA: Average tricycle speed in Gumaca is ~25-30 km/h
          // Adding 2 minutes base time for traffic/stops
          const avgSpeed = 28; // km/h
          const estimatedTime = Math.max(
            3,
            Math.ceil((distance / avgSpeed) * 60 + 2),
          ); // min

          return {
            ...ride,
            estimatedTime,
            distance: Math.round(distance * 10) / 10,
          };
        });

        setRideRequests(requestsWithEstimates);

        // Detect new ride request and show notification
        if (requestsWithEstimates.length > previousRideCountRef.current) {
          // New ride request(s) arrived
          const newRide = requestsWithEstimates[0]; // Show the latest ride
          setNewRideNotification(newRide);
          setIsNotificationVisible(true);
        }

        previousRideCountRef.current = requestsWithEstimates.length;
      } else {
        // If no pending rides, show empty state
        setRideRequests([]);
        previousRideCountRef.current = 0;
      }
    } catch (error) {
      console.error("Error loading ride requests:", error);
      showAlert(
        "Error",
        "Failed to load ride requests. Please try again.",
        "error",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    if (!user?.id) {
      showAlert("Error", "User not authenticated", "error");
      return;
    }

    const performAccept = async () => {
      try {
        setProcessingRideId(rideId);

        const response = await rideService.acceptRide(rideId, user.id);

        if (response.success && response.data) {
          // Remove accepted ride from list
          setRideRequests((prev) => prev.filter((ride) => ride.id !== rideId));
          setActiveRide(response.data);
          await getCurrentLocation(); // Get current GPS location
          setIsActiveRideVisible(true);

          showAlert("Success", "Ride accepted successfully!", "success");
        } else {
          showAlert(
            "Error",
            response.message || "Failed to accept ride",
            "error",
          );
        }
      } catch (error) {
        console.error("Error accepting ride:", error);
        showAlert("Error", "Failed to accept ride. Please try again.", "error");
      } finally {
        setProcessingRideId(null);
      }
    };

    showConfirm(
      "Accept Ride",
      "Are you sure you want to accept this ride request?",
      performAccept,
    );
  };

  const getCurrentLocation = async () => {
    try {
      // Web platform - use browser geolocation API
      if (Platform.OS === "web") {
        if (!navigator.geolocation) {
          showAlert(
            "Geolocation Not Supported",
            "Your browser does not support location services.",
            "error",
          );
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };

            setDriverLocation(coords);
            driverLocationRef.current = coords;
            await updateRoutePolylines(coords);

            // Update location in backend
            try {
              await driverService.updateDriverLocation(coords);
            } catch (error) {
              console.error("Failed to update location in backend:", error);
            }
          },
          (error) => {
            console.error("Web geolocation error:", error);
            showAlert(
              "Location Error",
              error.code === error.PERMISSION_DENIED
                ? "Please enable location access in your browser settings."
                : "Failed to get your current location. Please check your GPS settings.",
              "error",
            );
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000,
          },
        );
      } else {
        // Native platform - use Expo Location
        const { status } =
          await ExpoLocation.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          showAlert(
            "Location Permission Required",
            "Please enable location access to use this feature.",
            "warning",
          );
          return;
        }

        // Get current position with high accuracy
        const location = await ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.High,
        });

        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setDriverLocation(coords);
        driverLocationRef.current = coords;
        await updateRoutePolylines(coords);

        // Update location in backend
        try {
          await driverService.updateDriverLocation(coords);
        } catch (error) {
          console.error("Failed to update location in backend:", error);
        }
      }
    } catch (error) {
      console.error("Failed to get current location:", error);
      showAlert(
        "Location Error",
        "Failed to get your current location. Please check your GPS settings.",
        "error",
      );
    }
  };

  const loadDriverLocation = async () => {
    if (!user?.id) return;

    try {
      const profileResponse = await driverService.getDriverById(
        user.id,
        "user.location.latitude,user.location.longitude",
      );

      if (profileResponse.success) {
        const driverProfile = profileResponse.data as any;
        if (driverProfile?.user?.location) {
          setDriverLocation({
            latitude: driverProfile.user.location.latitude,
            longitude: driverProfile.user.location.longitude,
          });
          await updateRoutePolylines({
            latitude: driverProfile.user.location.latitude,
            longitude: driverProfile.user.location.longitude,
          });
          return;
        }
      }

      setDriverLocation(null);
    } catch (error) {
      console.error("Failed to load driver location:", error);
      setDriverLocation(null);
    }
  };

  const stopLocationWatcher = () => {
    if (Platform.OS === "web") {
      // Location tracking not supported on web
      return;
    }
    if (locationWatcher.current) {
      try {
        locationWatcher.current.remove();
        locationWatcher.current = null;
      } catch (error) {
        console.error("Error removing location watcher:", error);
        locationWatcher.current = null;
      }
    }
  };

  const pickupCoordinate = useMemo<Location | null>(() => {
    if (
      activeRide?.location?.latitude !== undefined &&
      activeRide.location.longitude !== undefined
    ) {
      return {
        latitude: activeRide.location.latitude,
        longitude: activeRide.location.longitude,
      };
    }
    return null;
  }, [activeRide?.location?.latitude, activeRide?.location?.longitude]);

  const dropoffCoordinate = useMemo<Location | null>(() => {
    const dropoffLocationData = (activeRide as any)?.dropoffLocation;
    if (
      dropoffLocationData?.latitude !== undefined &&
      dropoffLocationData?.longitude !== undefined
    ) {
      return {
        latitude: dropoffLocationData.latitude,
        longitude: dropoffLocationData.longitude,
      };
    }
    return null;
  }, [activeRide]);

  const updateRoutePolylines = useCallback(
    async (currentLocation?: Location) => {
      console.log("=== updateRoutePolylines called ===");
      const driverLoc = currentLocation || driverLocationRef.current;

      console.log("Driver location:", driverLoc);
      console.log("Pickup coordinate:", pickupCoordinate);
      console.log("Dropoff coordinate:", dropoffCoordinate);
      console.log("Active ride status:", activeRide?.status);

      if (!driverLoc) {
        console.log("No driver location, clearing routes");
        setRoutePolylines([]);
        lastRouteKeyRef.current = null;
        return;
      }

      const segments: Array<{
        id: string;
        from: Location;
        to: Location;
        color: string;
        weight: number;
      }> = [];

      if (pickupCoordinate) {
        console.log("Adding driver-to-pickup segment");
        segments.push({
          id: "driver-to-pickup",
          from: driverLoc,
          to: pickupCoordinate,
          color: "#22c55e",
          weight: 8,
        });
      }

      if (activeRide?.status === "in_progress" && dropoffCoordinate) {
        console.log("Adding driver-to-dropoff segment");
        segments.push({
          id: "driver-to-dropoff",
          from: driverLoc,
          to: dropoffCoordinate,
          color: "#2563eb",
          weight: 6,
        });
      }

      console.log("Total segments:", segments.length);

      if (segments.length === 0) {
        console.log("No segments, clearing routes");
        setRoutePolylines([]);
        lastRouteKeyRef.current = null;
        return;
      }

      // Set fallback straight-line routes immediately
      const fallbackRoutes: MapPolyline[] = segments.map((segment) => ({
        id: `${segment.id}-fallback`,
        path: [segment.from, segment.to],
        color: segment.color,
        weight: segment.weight,
      }));
      console.log("Setting fallback routes:", fallbackRoutes);
      setRoutePolylines(fallbackRoutes);

      const rounded = (value: number) => value.toFixed(5);
      const routeKey = segments
        .map(
          (segment) =>
            `${segment.id}:${rounded(segment.from.latitude)},${rounded(segment.from.longitude)}->${rounded(segment.to.latitude)},${rounded(segment.to.longitude)}`,
        )
        .join("|");

      console.log("Route key:", routeKey);
      console.log("Last route key:", lastRouteKeyRef.current);

      if (routeKey === lastRouteKeyRef.current) {
        console.log("Route key unchanged, skipping detailed route fetch");
        return;
      }

      console.log("Fetching detailed routes from API...");
      const routes = await Promise.all(
        segments.map(async (segment) => {
          console.log(`Fetching route for ${segment.id}`);
          const path = await getRouteBetween(segment.from, segment.to);
          console.log(`Route path length for ${segment.id}:`, path.length);
          if (path.length < 2) {
            console.log(
              `Route path too short for ${segment.id}, using fallback`,
            );
            // Return fallback straight line if API fails
            return {
              id: segment.id,
              path: [segment.from, segment.to],
              color: segment.color,
              weight: segment.weight,
            } as MapPolyline;
          }
          return {
            id: segment.id,
            path,
            color: segment.color,
            weight: segment.weight,
          } as MapPolyline;
        }),
      );

      const validRoutes = routes.filter((route): route is MapPolyline =>
        Boolean(route),
      );
      console.log("Valid detailed routes count:", validRoutes.length);
      console.log("Setting detailed route polylines:", validRoutes);
      setRoutePolylines(validRoutes);
      lastRouteKeyRef.current = routeKey;
      console.log("=== updateRoutePolylines complete ===");
    },
    [pickupCoordinate, dropoffCoordinate, activeRide?.status],
  );

  useEffect(() => {
    const shouldTrackLocation =
      isActiveRideVisible &&
      activeRide &&
      (activeRide.status === "accepted" || activeRide.status === "in_progress");

    if (!shouldTrackLocation) {
      stopLocationWatcher();
      return;
    }

    let isMounted = true;
    let lastSentLocation: Location | null = null;

    // Helper to calculate distance between two points in meters
    const calculateDistance = (loc1: Location, loc2: Location): number => {
      const R = 6371e3; // Earth radius in meters
      const φ1 = (loc1.latitude * Math.PI) / 180;
      const φ2 = (loc2.latitude * Math.PI) / 180;
      const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
      const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c;
    };

    const handleLocationUpdate = (coords: Location) => {
      if (!isMounted) return;

      // Update local state immediately for smooth UI
      setDriverLocation(coords);
      driverLocationRef.current = coords;

      // Only send updates if driver has moved significantly (> 20 meters)
      const shouldSendUpdate =
        !lastSentLocation || calculateDistance(lastSentLocation, coords) > 20;

      if (shouldSendUpdate) {
        lastSentLocation = coords;

        // Update route polylines
        updateRoutePolylines(coords);

        // Send location update via API (backend will broadcast via socket)
        driverService
          .updateDriverLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
          })
          .catch((error) =>
            console.error("Failed to sync driver location:", error),
          );
      }
    };

    const startTracking = async () => {
      try {
        // Web platform - use browser geolocation API
        if (Platform.OS === "web") {
          if (!navigator.geolocation) {
            showAlert(
              "Geolocation Not Supported",
              "Your browser does not support location tracking.",
              "error",
            );
            return;
          }

          const watchId = navigator.geolocation.watchPosition(
            (position) => {
              handleLocationUpdate({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            (error) => {
              console.error("Web geolocation error:", error);
              if (error.code === error.PERMISSION_DENIED) {
                showAlert(
                  "Location Permission Denied",
                  "Please enable location access in your browser settings.",
                  "warning",
                );
              }
            },
            {
              enableHighAccuracy: true,
              maximumAge: 3000,
              timeout: 10000,
            },
          );

          // Store the watch ID in a format compatible with stopLocationWatcher
          locationWatcher.current = {
            remove: () => navigator.geolocation.clearWatch(watchId),
          } as any;
        } else {
          // Native platform - use Expo Location
          const { status } =
            await ExpoLocation.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            showAlert(
              "Location Permission Required",
              "Please enable location access so passengers can track you in real time.",
              "warning",
            );
            return;
          }

          const subscription = await ExpoLocation.watchPositionAsync(
            {
              accuracy: ExpoLocation.Accuracy.High,
              distanceInterval: 20, // Only update when moved 20+ meters
              timeInterval: 10000, // Or every 10 seconds max
            },
            (position) => {
              handleLocationUpdate({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
          );

          locationWatcher.current = subscription;
        }
      } catch (error) {
        console.error("Failed to start location tracking:", error);
      }
    };

    startTracking();

    return () => {
      isMounted = false;
      stopLocationWatcher();
    };
  }, [isActiveRideVisible, activeRide?.status]);

  useEffect(() => {
    return () => {
      stopLocationWatcher();
    };
  }, []);

  // Update route polylines when active ride modal opens
  useEffect(() => {
    if (isActiveRideVisible && activeRide && driverLocationRef.current) {
      console.log("Active ride modal opened, updating routes...");
      updateRoutePolylines(driverLocationRef.current);
    }
  }, [isActiveRideVisible, activeRide?.id, updateRoutePolylines]);

  const updateActiveRideStatus = async (
    action: "start" | "complete" | "cancel",
    successMessage: string,
  ) => {
    if (!activeRide?.id) return;

    try {
      setIsRideStatusUpdating(true);

      let response;
      if (action === "start") {
        response = await rideService.startRide(activeRide.id);
      } else if (action === "complete") {
        response = await rideService.completeRide(activeRide.id);
      } else {
        response = await rideService.cancelRide(activeRide.id);
      }

      if (response?.success && response.data) {
        setActiveRide(response.data);
        showAlert("Success", successMessage, "success");
        if (action === "complete" || action === "cancel") {
          setIsActiveRideVisible(false);
          setActiveRide(null);
        }
      } else if (response) {
        showAlert(
          "Error",
          response.message || "Unable to update ride status",
          "error",
        );
      }
    } catch (error) {
      console.error("Failed to update ride status:", error);
      showAlert(
        "Error",
        "Unable to update ride status. Please try again.",
        "error",
      );
    } finally {
      setIsRideStatusUpdating(false);
    }
  };

  const renderActiveRideModal = () => {
    if (!activeRide) return null;

    const pickupMarker =
      activeRide.location && activeRide.location.latitude !== undefined
        ? {
            id: "pickup",
            location: {
              latitude: activeRide.location.latitude,
              longitude: activeRide.location.longitude,
            },
            title: "Pickup Location",
            color: "#22c55e",
          }
        : null;

    const markers = [
      ...(pickupMarker ? [pickupMarker] : []),
      ...(driverLocation
        ? [
            {
              id: "driver",
              location: driverLocation,
              title: "Your Location (Driver)",
              color: "#3b82f6",
            },
          ]
        : []),
    ];

    const mapCenter =
      driverLocation ||
      (pickupMarker
        ? pickupMarker.location
        : {
            latitude: 13.92077,
            longitude: 122.09891,
          });

    let polylinesToRender = routePolylines;

    // Debug logging
    console.log("=== Driver Map Rendering ===");
    console.log("Driver Location:", driverLocation);
    console.log("Pickup Marker:", pickupMarker);
    console.log("Route Polylines from state:", routePolylines);
    console.log("Polylines to render:", polylinesToRender);
    console.log("Active Ride Status:", activeRide?.status);
    console.log("========================");

    return (
      <Modal
        visible={isActiveRideVisible}
        animationType="slide"
        presentationStyle={Platform.OS === "web" ? undefined : "fullScreen"}
        style={
          Platform.OS === "web"
            ? {
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "white",
                zIndex: 1000,
              }
            : undefined
        }
        onRequestClose={() => {
          setIsActiveRideVisible(false);
        }}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="bg-black px-6 py-4 flex-row items-center justify-between">
            <TouchableOpacity onPress={() => setIsActiveRideVisible(false)}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-semibold">
              Active Ride
            </Text>
            <TouchableOpacity onPress={getCurrentLocation}>
              <Ionicons name="locate" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View className="flex-1">
            <MapView
              center={mapCenter}
              markers={markers}
              polylines={polylinesToRender}
              height={400}
              className="flex-1"
            />
          </View>

          <View className="bg-white p-6 border-t border-gray-200">
            <View className="mb-4">
              <Text className="text-black text-xl font-semibold mb-1">
                Status:{" "}
                <Text className="text-blue-600 capitalize">
                  {activeRide.status?.replace("_", " ") || "pending"}
                </Text>
              </Text>
              <Text className="text-gray-600">
                Passenger:{" "}
                {`${activeRide.passenger?.firstName ?? ""} ${activeRide.passenger?.lastName ?? ""}`.trim() ||
                  "N/A"}
              </Text>
              {driverLocation && (
                <Text className="text-gray-500 text-xs mt-1">
                  📍 Your Location: {driverLocation.latitude.toFixed(5)},{" "}
                  {driverLocation.longitude.toFixed(5)}
                </Text>
              )}
            </View>

            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              <View className="flex-row items-center mb-3">
                <Ionicons name="radio-button-on" size={16} color="#22c55e" />
                <Text className="text-black ml-2 flex-1">
                  {activeRide.pickup}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="location" size={16} color="#ef4444" />
                <Text className="text-black ml-2 flex-1">
                  {activeRide.dropoff}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-gray-600 text-sm">Fare</Text>
                <Text className="text-black text-lg font-semibold">
                  ₱{activeRide.fare}
                </Text>
              </View>
              <View>
                <Text className="text-gray-600 text-sm">Payment</Text>
                <Text className="text-black text-lg font-semibold">
                  {activeRide.paymentMode?.toUpperCase()}
                </Text>
              </View>
              <View>
                <Text className="text-gray-600 text-sm">ETA</Text>
                <Text className="text-black text-lg font-semibold">
                  {driverLocation && activeRide.location
                    ? `${calculateETA(
                        driverLocation,
                        activeRide.status === "in_progress" &&
                          (activeRide as any).dropoffLocation
                          ? (activeRide as any).dropoffLocation
                          : activeRide.location,
                      )} mins`
                    : activeRide.eta
                      ? `${activeRide.eta} mins`
                      : "N/A"}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              {activeRide.status === "accepted" && (
                <TouchableOpacity
                  onPress={() =>
                    updateActiveRideStatus(
                      "start",
                      "Ride started successfully!",
                    )
                  }
                  className="flex-1 bg-black rounded-xl py-3"
                  disabled={isRideStatusUpdating}
                >
                  <View className="flex-row items-center justify-center">
                    {isRideStatusUpdating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="play" size={18} color="#fff" />
                    )}
                    <Text className="text-white font-semibold ml-2">
                      Start Ride
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {activeRide.status === "in_progress" && (
                <TouchableOpacity
                  onPress={() =>
                    updateActiveRideStatus(
                      "complete",
                      "Ride marked as completed. Great job!",
                    )
                  }
                  className="flex-1 bg-green-600 rounded-xl py-3"
                  disabled={isRideStatusUpdating}
                >
                  <View className="flex-row items-center justify-center">
                    {isRideStatusUpdating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    )}
                    <Text className="text-white font-semibold ml-2">
                      Complete Ride
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {activeRide.status !== "completed" &&
                activeRide.status !== "cancelled" && (
                  <TouchableOpacity
                    onPress={() =>
                      updateActiveRideStatus(
                        "cancel",
                        "Ride has been cancelled.",
                      )
                    }
                    className="flex-1 bg-red-50 border border-red-200 rounded-xl py-3"
                    disabled={isRideStatusUpdating}
                  >
                    <View className="flex-row items-center justify-center">
                      {isRideStatusUpdating ? (
                        <ActivityIndicator size="small" color="#ef4444" />
                      ) : (
                        <Ionicons name="close" size={18} color="#ef4444" />
                      )}
                      <Text className="text-red-600 font-semibold ml-2">
                        Cancel Ride
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  const calculateDistance = (
    location1: Location,
    location2: Location,
  ): number => {
    // Haversine formula for accurate distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = ((location2.latitude - location1.latitude) * Math.PI) / 180;
    const dLon = ((location2.longitude - location1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((location1.latitude * Math.PI) / 180) *
        Math.cos((location2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateETA = (
    currentLocation: Location,
    destinationLocation: Location,
  ): number => {
    // Calculate distance between current and destination
    const distance = calculateDistance(currentLocation, destinationLocation);
    // Average tricycle speed: 28 km/h
    const avgSpeed = 28;
    // Add 2 minutes base time for traffic/stops
    const eta = Math.max(2, Math.ceil((distance / avgSpeed) * 60 + 2));
    return eta;
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const renderNewRideNotificationModal = () => {
    if (!newRideNotification) return null;

    return (
      <Modal
        visible={isNotificationVisible}
        transparent={Platform.OS !== "web"}
        animationType="slide"
        style={
          Platform.OS === "web"
            ? {
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.4)",
                zIndex: 1000,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "flex-end",
              }
            : undefined
        }
        onRequestClose={() => setIsNotificationVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl p-6 pb-8">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-3">
                  <Ionicons name="sparkles" size={24} color="#22c55e" />
                </View>
                <View>
                  <Text className="text-black text-lg font-bold">
                    New Ride Request!
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    You have a ride opportunity
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsNotificationVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Passenger Info */}
            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-3">
                  <Text className="text-blue-600 font-bold text-lg">
                    {newRideNotification.passenger?.firstName?.charAt(0) || "P"}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-black font-semibold">
                    {newRideNotification.passenger?.firstName || "Passenger"}{" "}
                    {newRideNotification.passenger?.lastName || ""}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {newRideNotification.passenger?.email || "N/A"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Route Info */}
            <View className="mb-4">
              <View className="flex-row items-center mb-3">
                <View className="w-6 h-6 bg-green-100 rounded-full items-center justify-center mr-3">
                  <Ionicons name="radio-button-on" size={12} color="#22c55e" />
                </View>
                <Text
                  className="text-black flex-1 font-medium"
                  numberOfLines={2}
                >
                  {newRideNotification.pickup}
                </Text>
              </View>

              <View className="ml-3 border-l-2 border-dashed border-gray-300 h-6 mb-3" />

              <View className="flex-row items-center">
                <View className="w-6 h-6 bg-red-100 rounded-full items-center justify-center mr-3">
                  <Ionicons name="location" size={12} color="#ef4444" />
                </View>
                <Text
                  className="text-black flex-1 font-medium"
                  numberOfLines={2}
                >
                  {newRideNotification.dropoff}
                </Text>
              </View>
            </View>

            {/* Ride Details */}
            <View className="flex-row justify-around mb-6 bg-gray-50 rounded-xl p-4">
              <View className="items-center">
                <Text className="text-gray-600 text-sm mb-1">Distance</Text>
                <Text className="text-black font-bold text-lg">
                  {newRideNotification.distance || 0} km
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-gray-600 text-sm mb-1">Fare</Text>
                <Text className="text-black font-bold text-lg">
                  ₱{newRideNotification.fare}
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-gray-600 text-sm mb-1">ETA</Text>
                <Text className="text-black font-bold text-lg">
                  {newRideNotification.estimatedTime || 0} min
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setIsNotificationVisible(false)}
                className="flex-1 bg-gray-200 rounded-xl py-3"
              >
                <Text className="text-center text-gray-700 font-semibold">
                  Decline
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setIsNotificationVisible(false);
                  handleAcceptRide(newRideNotification.id);
                }}
                className="flex-1 bg-green-600 rounded-xl py-3"
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="checkmark-circle" size={18} color="white" />
                  <Text className="text-center text-white font-semibold ml-2">
                    Accept
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderRideRequest = ({ item }: { item: RideRequest }) => (
    <View className="bg-white mx-4 mb-4 rounded-xl p-4 shadow-sm border border-gray-100">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
            <Text className="text-blue-600 font-bold text-lg">
              {item.passenger?.firstName?.charAt(0) || "P"}
            </Text>
          </View>
          <View>
            <Text className="text-black font-semibold">
              {item.passenger?.firstName || "Unknown"}{" "}
              {item.passenger?.lastName || "Passenger"}
            </Text>
            <Text className="text-gray-500 text-sm">
              {formatTimeAgo(item.createdAt)}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-black text-xl font-bold">₱{item.fare}</Text>
          <Text className="text-gray-500 text-sm">
            {item.estimatedTime || 0} min away
          </Text>
        </View>
      </View>

      {/* Route */}
      <View className="mb-4">
        <View className="flex-row items-center mb-2">
          <Ionicons name="radio-button-on" size={12} color="#22c55e" />
          <Text className="text-black ml-2 flex-1" numberOfLines={2}>
            {item.pickup}
          </Text>
        </View>
        <View className="ml-6 border-l-2 border-dashed border-gray-300 h-4" />
        <View className="flex-row items-center">
          <Ionicons name="location" size={12} color="#ef4444" />
          <Text className="text-black ml-2 flex-1" numberOfLines={2}>
            {item.dropoff}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <Ionicons name="car" size={16} color="#6b7280" />
          <Text className="text-gray-600 text-sm ml-1">
            {item.distance || 0}km
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="wallet" size={16} color="#6b7280" />
          <Text className="text-gray-600 text-sm ml-1">
            {item.paymentMode?.toUpperCase() || "CASH"}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="time" size={16} color="#6b7280" />
          <Text className="text-gray-600 text-sm ml-1">
            ~{item.estimatedTime || 0} min
          </Text>
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        onPress={() => handleAcceptRide(item.id)}
        disabled={processingRideId === item.id}
        className={`rounded-xl py-3 ${processingRideId === item.id ? "bg-gray-300" : "bg-black"}`}
        style={
          Platform.OS === "web"
            ? ({
                cursor:
                  processingRideId === item.id ? "not-allowed" : "pointer",
                userSelect: "none",
                outline: "none",
              } as any)
            : undefined
        }
        activeOpacity={0.8}
      >
        {processingRideId === item.id ? (
          <View className="flex-row items-center justify-center">
            <ActivityIndicator size="small" color="#666" />
            <Text className="text-gray-600 font-medium ml-2">Accepting...</Text>
          </View>
        ) : (
          <Text className="text-white text-center font-semibold">
            Accept Ride
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-6">
      <Ionicons name="notifications-off-outline" size={64} color="#d1d5db" />
      <Text className="text-gray-500 text-lg font-medium mt-4 mb-2">
        No Ride Requests
      </Text>
      <Text className="text-gray-400 text-center">
        There are no pending ride requests at the moment. Pull down to refresh
        or check back later.
      </Text>
      <TouchableOpacity
        onPress={() => loadRideRequests()}
        className="bg-black rounded-xl px-6 py-3 mt-6"
      >
        <Text className="text-white font-medium">Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && rideRequests.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-black px-6 py-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">
            Ride Requests
          </Text>
        </View>

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#000" />
          <Text className="text-gray-500 mt-4">Loading ride requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-black px-4 py-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-semibold">
              Ride Requests
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={getCurrentLocation} className="p-1">
              <Ionicons name="locate" size={22} color="white" />
            </TouchableOpacity>
            <View className="bg-white/20 rounded-full px-3 py-1">
              <Text className="text-white text-sm font-medium">
                {rideRequests.length} available
              </Text>
            </View>
          </View>
        </View>

        {/* Ride Requests List */}
        {rideRequests.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={rideRequests}
            keyExtractor={(item) => item.id}
            renderItem={renderRideRequest}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => loadRideRequests()}
                colors={["#000000"]}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
      {renderNewRideNotificationModal()}
      {renderActiveRideModal()}

      {/* Alert Modal */}
      <AlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={alertConfig.onClose}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        visible={confirmConfig.visible}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText="Accept"
        cancelText="Cancel"
        onConfirm={confirmConfig.onConfirm}
        onCancel={confirmConfig.onCancel}
        icon="help-circle"
      />
    </>
  );
}
