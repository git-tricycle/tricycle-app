import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  tripShareService,
  type SharedTripData,
  socketService,
  type RideLocationUpdate,
  type RideStatusUpdate,
} from "@/src/services";

interface SharedTripTrackerProps {
  shareToken: string;
}

export default function SharedTripTracker({
  shareToken,
}: SharedTripTrackerProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tripData, setTripData] = useState<SharedTripData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnectedToSocket, setIsConnectedToSocket] = useState(false);

  const fetchTripData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const response = await tripShareService.getSharedTripData(shareToken);

        if (response.success && response.data) {
          setTripData(response.data);
        } else {
          setError(response.message || "Failed to load trip data");
        }
      } catch (err) {
        console.error("Error fetching trip data:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [shareToken],
  );

  useEffect(() => {
    fetchTripData();
  }, [fetchTripData]);

  // Socket.IO real-time updates - replaces polling
  useEffect(() => {
    if (!tripData || tripData.tripInfo.status === "completed") {
      return;
    }

    let isActive = true;

    const connectAndJoinShare = async () => {
      try {
        // Connect to socket if not already connected
        if (!socketService.isConnected()) {
          await socketService.connectWithShareToken(shareToken);
        }

        if (!isActive) return;

        // Join the ride room using share token
        socketService.joinWithShareToken(shareToken);
        setIsConnectedToSocket(true);

        // Listen for location updates
        const handleLocationUpdate = (data: RideLocationUpdate) => {
          if (isActive && tripData) {
            console.log("Real-time location update:", data.location);
            setTripData((prev) =>
              prev
                ? {
                    ...prev,
                    currentLocation: {
                      latitude: data.location.latitude,
                      longitude: data.location.longitude,
                      lastUpdated: new Date(
                        data.location.timestamp,
                      ).toISOString(),
                    },
                  }
                : prev,
            );
          }
        };

        // Listen for status updates
        const handleStatusUpdate = async (data: RideStatusUpdate) => {
          if (isActive) {
            console.log("Real-time status update:", data.status);
            // Fetch updated trip data
            await fetchTripData(true);
          }
        };

        // Subscribe to events
        socketService.on("ride:location:update", handleLocationUpdate);
        socketService.on("ride:status:update", handleStatusUpdate);

        // Cleanup function
        return () => {
          isActive = false;
          socketService.off("ride:location:update", handleLocationUpdate);
          socketService.off("ride:status:update", handleStatusUpdate);
          setIsConnectedToSocket(false);
        };
      } catch (error) {
        console.error("Failed to connect to Socket.IO:", error);
        setIsConnectedToSocket(false);
      }
    };

    const cleanup = connectAndJoinShare();

    return () => {
      isActive = false;
      cleanup.then((cleanupFn) => cleanupFn?.());
    };
  }, [tripData?.tripInfo.status, shareToken]);

  const handleRefresh = () => {
    fetchTripData(true);
  };

  const handleOpenMap = () => {
    if (tripData?.currentLocation) {
      const { latitude, longitude } = tripData.currentLocation;
      const url = Platform.select({
        ios: `maps:0,0?q=${latitude},${longitude}`,
        android: `geo:0,0?q=${latitude},${longitude}`,
        default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      });
      Linking.openURL(url).catch((err) =>
        console.error("Error opening map:", err),
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-orange-500";
      case "in_progress":
        return "bg-green-500";
      case "completed":
        return "bg-blue-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "accepted":
        return "Driver Assigned";
      case "in_progress":
        return "Trip in Progress";
      case "completed":
        return "Trip Completed";
      case "cancelled":
        return "Trip Cancelled";
      default:
        return status;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading && !tripData) {
    return (
      <View className="flex-1 justify-center items-center p-5 bg-gray-50">
        <ActivityIndicator size="large" color="#2196F3" />
        <Text className="mt-4 text-base text-gray-600">
          Loading trip information...
        </Text>
      </View>
    );
  }

  if (error && !tripData) {
    return (
      <View className="flex-1 justify-center items-center p-5 bg-gray-50">
        <Ionicons name="alert-circle" size={64} color="#F44336" />
        <Text className="text-xl font-bold text-gray-900 mt-4 mb-2">
          Unable to Load Trip
        </Text>
        <Text className="text-sm text-gray-600 text-center mb-5">{error}</Text>
        <TouchableOpacity
          onPress={() => fetchTripData()}
          className="bg-blue-600 px-6 py-3 rounded-lg"
        >
          <Text className="text-white text-base font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!tripData) {
    return null;
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View className="bg-white p-5 border-b border-gray-200">
        <View className="flex-row items-center">
          <Ionicons name="navigate-circle" size={32} color="#2196F3" />
          <View className="ml-3 flex-1">
            <Text className="text-xl font-bold text-gray-900">
              Live Trip Tracking
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              {tripData.passenger.name}&apos;s journey
            </Text>
          </View>
        </View>
      </View>

      {/* Status Badge */}
      <View className="flex-row items-center p-4 gap-3">
        <View
          className={`px-4 py-2 rounded-full ${getStatusColor(tripData.tripInfo.status)}`}
        >
          <Text className="text-white text-sm font-semibold">
            {getStatusText(tripData.tripInfo.status)}
          </Text>
        </View>
        {tripData.tripInfo.eta &&
          tripData.tripInfo.status === "in_progress" && (
            <View className="flex-row items-center bg-white px-3 py-1.5 rounded-2xl gap-1">
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text className="text-xs text-gray-600 font-medium">
                ETA: {tripData.tripInfo.eta} min
              </Text>
            </View>
          )}
      </View>

      {/* Trip Route */}
      <View className="bg-white mx-4 mb-4 rounded-xl p-4 shadow-sm">
        <Text className="text-base font-semibold text-gray-900 mb-3">
          Trip Route
        </Text>
        <View>
          <View className="flex-row items-start">
            <View className="w-10 items-center">
              <Ionicons name="location" size={24} color="#4CAF50" />
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-xs text-gray-600 mb-1">Pickup</Text>
              <Text className="text-sm text-gray-900 font-medium">
                {tripData.tripInfo.pickup}
              </Text>
            </View>
          </View>

          <View className="w-0.5 h-5 bg-gray-200 ml-5 my-2" />

          <View className="flex-row items-start">
            <View className="w-10 items-center">
              <Ionicons name="flag" size={24} color="#F44336" />
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-xs text-gray-600 mb-1">Dropoff</Text>
              <Text className="text-sm text-gray-900 font-medium">
                {tripData.tripInfo.dropoff}
              </Text>
            </View>
          </View>
        </View>

        <Text className="text-xs text-gray-400 mt-2">
          Started: {formatDate(tripData.tripInfo.createdAt)} at{" "}
          {formatTime(tripData.tripInfo.createdAt)}
        </Text>
      </View>

      {/* Current Location */}
      {tripData.currentLocation && (
        <View className="bg-white mx-4 mb-4 rounded-xl p-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-semibold text-gray-900">
              Current Location
            </Text>
            <TouchableOpacity
              onPress={handleOpenMap}
              className="flex-row items-center"
            >
              <Ionicons name="map-outline" size={20} color="#2196F3" />
              <Text className="text-sm text-blue-600 font-medium ml-1">
                Open in Maps
              </Text>
            </TouchableOpacity>
          </View>
          <View className="mb-3">
            <View className="flex-row items-center mb-2">
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text className="ml-2 text-sm text-gray-900 font-mono">
                {tripData.currentLocation.latitude.toFixed(6)},{" "}
                {tripData.currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
            <Text className="text-xs text-gray-400 ml-7">
              Last updated: {formatTime(tripData.currentLocation.lastUpdated)}
            </Text>
          </View>
          <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
            <Text className="text-sm text-gray-900">Real-time tracking</Text>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
              <Text className="text-xs text-green-600 font-medium">Active</Text>
            </View>
          </View>
        </View>
      )}

      {/* Driver Info */}
      {tripData.driver && (
        <View className="bg-white mx-4 mb-4 rounded-xl p-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Driver Information
          </Text>
          <View className="flex-row items-center">
            <View className="w-14 h-14 rounded-full bg-blue-600 justify-center items-center">
              <Ionicons name="person" size={32} color="#fff" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-semibold text-gray-900 mb-1">
                {tripData.driver.name}
              </Text>
              {tripData.driver.vehicle && (
                <Text className="text-sm text-gray-600">
                  {tripData.driver.vehicle.plateNumber || "Vehicle"}{" "}
                  {tripData.driver.vehicle.bodyNumber &&
                    `(${tripData.driver.vehicle.bodyNumber})`}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Passenger Contact */}
      {tripData.passenger.contact && (
        <View className="bg-white mx-4 mb-4 rounded-xl p-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Passenger Contact
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="call-outline" size={20} color="#666" />
            <Text className="ml-2 text-sm text-gray-900">
              {tripData.passenger.contact}
            </Text>
          </View>
        </View>
      )}

      {/* Share Info */}
      <View className="bg-white mx-4 mb-8 rounded-xl p-4">
        <View className="flex-row items-center mb-2">
          <Ionicons name="shield-checkmark" size={16} color="#666" />
          <Text className="ml-2 text-xs text-gray-600">
            Secure live tracking
          </Text>
        </View>
        <View className="flex-row items-center mb-2">
          <Ionicons name="eye-outline" size={16} color="#666" />
          <Text className="ml-2 text-xs text-gray-600">
            Views: {tripData.shareInfo.viewCount}
          </Text>
        </View>
        <Text className="text-xs text-gray-400 mt-2">
          Link expires: {formatDate(tripData.shareInfo.expiresAt)} at{" "}
          {formatTime(tripData.shareInfo.expiresAt)}
        </Text>
      </View>
    </ScrollView>
  );
}
