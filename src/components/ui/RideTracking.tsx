import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, Linking } from "react-native";
import MapView, { Location, MapViewRef } from "./MapView";

interface Driver {
  id: string;
  name: string;
  rating: number;
  vehicleNumber: string;
  estimatedArrival: number;
  location: Location;
  photo?: string;
  phoneNumber?: string;
}

interface RideTrackingProps {
  driver: Driver;
  pickupLocation: Location & { address: string };
  dropoffLocation?: Location & { address: string };
  fare: number;
  rideId: string;
  onRideComplete?: () => void;
  onRideCancel?: () => void;
  className?: string;
}

type RideStatus =
  | "finding_driver"
  | "driver_assigned"
  | "driver_on_way"
  | "driver_arrived"
  | "in_progress"
  | "completed";

export default function RideTracking({
  driver,
  pickupLocation,
  dropoffLocation,
  fare,
  rideId,
  onRideComplete,
  onRideCancel,
  className = "",
}: RideTrackingProps) {
  const [rideStatus, setRideStatus] = useState<RideStatus>("driver_assigned");
  const [eta, setEta] = useState(driver.estimatedArrival);
  const [driverLocation, setDriverLocation] = useState(driver.location);

  // Simulate ride progression
  useEffect(() => {
    const progressRide = () => {
      setTimeout(() => {
        setRideStatus("driver_on_way");
        setEta(Math.max(1, eta - 1));
      }, 2000);

      setTimeout(() => {
        setRideStatus("driver_arrived");
        setEta(0);
      }, 30000);

      setTimeout(() => {
        setRideStatus("in_progress");
      }, 45000);

      setTimeout(() => {
        setRideStatus("completed");
        onRideComplete?.();
      }, 120000);
    };

    progressRide();
  }, []);

  // Simulate driver location updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate driver moving towards pickup location
      setDriverLocation((prev) => ({
        latitude: prev.latitude + (Math.random() - 0.5) * 0.001,
        longitude: prev.longitude + (Math.random() - 0.5) * 0.001,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusMessage = () => {
    switch (rideStatus) {
      case "driver_assigned":
        return "Driver has been assigned to your ride";
      case "driver_on_way":
        return "Driver is on the way to pick you up";
      case "driver_arrived":
        return "Driver has arrived at pickup location";
      case "in_progress":
        return "Ride in progress";
      case "completed":
        return "Ride completed";
      default:
        return "Processing your ride...";
    }
  };

  const getStatusColor = () => {
    switch (rideStatus) {
      case "driver_assigned":
        return "text-blue-600";
      case "driver_on_way":
        return "text-orange-600";
      case "driver_arrived":
        return "text-green-600";
      case "in_progress":
        return "text-purple-600";
      case "completed":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const handleCallDriver = () => {
    if (driver.phoneNumber) {
      Linking.openURL(`tel:${driver.phoneNumber}`);
    } else {
      Alert.alert("No Contact", "Driver contact information is not available");
    }
  };

  const handleCancelRide = () => {
    Alert.alert(
      "Cancel Ride",
      "Are you sure you want to cancel this ride? Cancellation fees may apply.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: onRideCancel,
        },
      ]
    );
  };

  const handleShareTrip = () => {
    // In a real app, this would generate a shareable link with live tracking
    Alert.alert("Share Trip", "Share your live trip status with friends and family for safety.");
  };

  const handleSOS = () => {
    Alert.alert(
      "Emergency SOS",
      "This will immediately alert emergency contacts and authorities. Only use in real emergencies.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send SOS",
          style: "destructive",
          onPress: () => {
            // In real app, send SOS to emergency contacts and authorities
            Alert.alert("SOS Sent", "Emergency alert has been sent to your emergency contacts.");
          },
        },
      ]
    );
  };

  return (
    <View className={`flex-1 bg-white ${className}`}>
      {/* Map */}
      <View className="flex-1">
        <MapView
          center={driverLocation}
          markers={[
            {
              id: "pickup",
              location: pickupLocation,
              title: "Pickup Location",
              color: "#22c55e",
            },
            ...(dropoffLocation
              ? [
                  {
                    id: "dropoff",
                    location: dropoffLocation,
                    title: "Dropoff Location",
                    color: "#ef4444",
                  },
                ]
              : []),
            {
              id: "driver",
              location: driverLocation,
              title: `${driver.name} (${driver.vehicleNumber})`,
              color: "#3b82f6",
            },
          ]}
          height={400}
          className="flex-1"
        />

        {/* Status Badge */}
        <View className="absolute top-4 left-4 right-4">
          <View className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-sm">
            <Text className={`text-center font-semibold ${getStatusColor()}`}>
              {getStatusMessage()}
            </Text>
            {eta > 0 && (
              <Text className="text-center text-gray-600 text-sm mt-1">ETA: {eta} minutes</Text>
            )}
          </View>
        </View>

        {/* Safety Actions */}
        <View className="absolute top-20 right-4 space-y-2 gap-2">
          <TouchableOpacity
            onPress={handleShareTrip}
            className="w-12 h-12 bg-white/90 rounded-full items-center justify-center shadow-sm"
          >
            <Ionicons name="share" size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSOS}
            className="w-12 h-12 bg-red-500/90 rounded-full items-center justify-center shadow-sm"
          >
            <Ionicons name="warning" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Driver Info Panel */}
      <View className="bg-white p-6 border-t border-gray-200">
        {/* Driver Details */}
        <View className="flex-row items-center mb-4">
          <View className="w-16 h-16 bg-gray-200 rounded-full mr-4 items-center justify-center">
            {driver.photo ? (
              <Text>Photo</Text> // In real app, use Image component
            ) : (
              <Ionicons name="person" size={32} color="#6b7280" />
            )}
          </View>

          <View className="flex-1">
            <Text className="text-black text-lg font-semibold">{driver.name}</Text>
            <View className="flex-row items-center">
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text className="text-gray-600 ml-1">{driver.rating}</Text>
              <Text className="text-gray-400 mx-2">•</Text>
              <Text className="text-gray-600">{driver.vehicleNumber}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleCallDriver}
            className="w-12 h-12 bg-green-100 rounded-full items-center justify-center"
          >
            <Ionicons name="call" size={24} color="#22c55e" />
          </TouchableOpacity>
        </View>

        {/* Trip Info */}
        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-600">Fare</Text>
            <Text className="text-black font-bold text-lg">₱{fare}</Text>
          </View>

          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-600">Ride ID</Text>
            <Text className="text-gray-800 font-mono text-sm">{rideId}</Text>
          </View>

          <View className="border-t border-gray-200 pt-3 mt-3">
            <View className="flex-row items-center mb-2">
              <View className="w-2 h-2 bg-green-500 rounded-full mr-3" />
              <Text className="text-gray-800 text-sm flex-1">{pickupLocation.address}</Text>
            </View>
            {dropoffLocation && (
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-red-500 rounded-full mr-3" />
                <Text className="text-gray-800 text-sm flex-1">{dropoffLocation.address}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row space-x-3 gap-3">
          <TouchableOpacity
            onPress={handleShareTrip}
            className="flex-1 bg-gray-100 rounded-xl py-3"
          >
            <View className="items-center">
              <Ionicons name="share" size={20} color="#6b7280" />
              <Text className="text-gray-700 text-sm mt-1">Share Trip</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCancelRide}
            className="flex-1 bg-red-50 border border-red-200 rounded-xl py-3"
          >
            <View className="items-center">
              <Ionicons name="close" size={20} color="#ef4444" />
              <Text className="text-red-600 text-sm mt-1">Cancel</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
