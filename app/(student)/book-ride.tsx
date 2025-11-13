import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Location, MapViewRef } from "@/src/components/ui/MapView";
import LocationPicker from "@/src/components/ui/LocationPicker";
import { useAuth } from "@/src/contexts/AuthContext";
import { rideService } from "@/src/services/ride.service";

type BookingStep =
  | "location-selection"
  | "driver-search"
  | "driver-found"
  | "ride-tracking"
  | "ride-completed";

interface BookingLocation extends Location {
  address: string;
}

interface Driver {
  id: string;
  name: string;
  rating: number;
  vehicleNumber: string;
  estimatedArrival: number;
  location: Location;
  photo?: string;
}

export default function BookRideScreen() {
  const { user } = useAuth();
  const mapRef = useRef<MapViewRef>(null);

  // Booking state
  const [currentStep, setCurrentStep] = useState<BookingStep>("location-selection");
  const [pickupLocation, setPickupLocation] = useState<BookingLocation | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<BookingLocation | null>(null);
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<"cash" | "gcash">("cash");

  // Location picker state
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationPickerType, setLocationPickerType] = useState<"pickup" | "dropoff">("pickup");

  // Driver search state
  const [isSearchingDriver, setIsSearchingDriver] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Ride state
  const [currentRide, setCurrentRide] = useState<any>(null);
  const [rideStatus, setRideStatus] = useState<string>("");

  // Calculate estimated fare when locations are set
  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      calculateEstimatedFare();
    }
  }, [pickupLocation, dropoffLocation]);

  const calculateEstimatedFare = () => {
    // Simple distance-based fare calculation (mock)
    const distance = calculateDistance(pickupLocation!, dropoffLocation!);
    const baseFare = 15; // Base fare in PHP
    const perKmRate = 8; // Rate per kilometer
    const fare = baseFare + distance * perKmRate;
    setEstimatedFare(Math.round(fare));
  };

  const calculateDistance = (location1: Location, location2: Location): number => {
    // Haversine formula for distance calculation
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

  const handleLocationSelect = (type: "pickup" | "dropoff") => {
    setLocationPickerType(type);
    setShowLocationPicker(true);
  };

  const handleLocationConfirm = (location: BookingLocation) => {
    if (locationPickerType === "pickup") {
      setPickupLocation(location);
    } else {
      setDropoffLocation(location);
    }
    setShowLocationPicker(false);
  };

  const searchForDrivers = async () => {
    if (!pickupLocation || !dropoffLocation || !user) {
      Alert.alert("Error", "Please select both pickup and dropoff locations");
      return;
    }

    setIsSearchingDriver(true);
    setCurrentStep("driver-search");

    try {
      // Get available drivers from API
      const response = await rideService.getAvailableDrivers({
        latitude: pickupLocation.latitude,
        longitude: pickupLocation.longitude,
        limit: 10,
      });

      if (response.success && response.data) {
        // Transform API data to match our Driver interface
        const drivers: Driver[] = response.data.map((driver) => ({
          id: driver.id,
          name: driver.name,
          rating: driver.rating,
          vehicleNumber: driver.vehicleNumber,
          estimatedArrival: driver.estimatedArrival,
          location: driver.location
            ? {
                latitude: driver.location.latitude,
                longitude: driver.location.longitude,
              }
            : pickupLocation, // Use pickup location as fallback
          photo: undefined,
        }));

        setAvailableDrivers(drivers);
        setCurrentStep("driver-found");
      } else {
        Alert.alert(
          "No Drivers Available",
          "Sorry, there are no available drivers in your area at the moment. Please try again later."
        );
        setCurrentStep("location-selection");
      }
    } catch (error) {
      console.error("Error searching for drivers:", error);
      Alert.alert(
        "Error",
        "Failed to find available drivers. Please check your internet connection and try again."
      );
      setCurrentStep("location-selection");
    } finally {
      setIsSearchingDriver(false);
    }
  };

  const bookRideWithDriver = async (driver: Driver) => {
    try {
      setSelectedDriver(driver);

      const rideData = {
        pickup: pickupLocation!.address,
        dropoff: dropoffLocation!.address,
        fare: estimatedFare!,
        paymentMode: selectedPaymentMode,
        eta: driver.estimatedArrival,
      };

      const response = await rideService.createRide(rideData);

      if (response.success && response.data) {
        setCurrentRide(response.data);
        setCurrentStep("ride-tracking");
        setRideStatus("Finding your driver...");

        // Mock ride progression
        setTimeout(() => setRideStatus("Driver is on the way"), 2000);
        setTimeout(() => setRideStatus("Driver has arrived"), 60000);
      } else {
        Alert.alert("Error", response.message || "Failed to book ride");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to book ride. Please try again.");
      console.error("Booking error:", error);
    }
  };

  const cancelRide = () => {
    Alert.alert("Cancel Ride", "Are you sure you want to cancel this ride?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: () => {
          setCurrentStep("location-selection");
          setSelectedDriver(null);
          setCurrentRide(null);
          setRideStatus("");
        },
      },
    ]);
  };

  const renderLocationSelectionStep = () => (
    <>
      {/* Map */}
      <View className="flex-1">
        <MapView
          ref={mapRef}
          center={{ latitude: 13.92077, longitude: 122.09891 }}
          markers={[
            ...(pickupLocation
              ? [
                  {
                    id: "pickup",
                    location: pickupLocation,
                    title: "Pickup Location",
                    color: "#22c55e",
                  },
                ]
              : []),
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
          ]}
          height={400}
          className="flex-1"
        />
      </View>

      {/* Location Selection Panel */}
      <View className="bg-white p-6">
        {/* Pickup Location */}
        <TouchableOpacity
          onPress={() => handleLocationSelect("pickup")}
          className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-200"
        >
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-green-500 rounded-full mr-3" />
            <View className="flex-1">
              <Text className="text-gray-600 text-sm">From</Text>
              <Text className="text-black font-medium">
                {pickupLocation?.address || "Select pickup location"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </View>
        </TouchableOpacity>

        {/* Dropoff Location */}
        <TouchableOpacity
          onPress={() => handleLocationSelect("dropoff")}
          className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200"
        >
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-red-500 rounded-full mr-3" />
            <View className="flex-1">
              <Text className="text-gray-600 text-sm">To</Text>
              <Text className="text-black font-medium">
                {dropoffLocation?.address || "Select dropoff location"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </View>
        </TouchableOpacity>

        {/* Fare and Payment */}
        {estimatedFare && (
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-black font-medium">Estimated Fare:</Text>
              <Text className="text-black font-bold text-lg">₱{estimatedFare}</Text>
            </View>

            {/* Payment Mode Selection */}
            <View className="flex-row space-x-3 gap-3">
              <TouchableOpacity
                onPress={() => setSelectedPaymentMode("cash")}
                className={`flex-1 p-3 rounded-lg border ${
                  selectedPaymentMode === "cash"
                    ? "bg-black border-black"
                    : "bg-white border-gray-300"
                }`}
              >
                <Text
                  className={`text-center font-medium ${
                    selectedPaymentMode === "cash" ? "text-white" : "text-black"
                  }`}
                >
                  Cash
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedPaymentMode("gcash")}
                className={`flex-1 p-3 rounded-lg border ${
                  selectedPaymentMode === "gcash"
                    ? "bg-black border-black"
                    : "bg-white border-gray-300"
                }`}
              >
                <Text
                  className={`text-center font-medium ${
                    selectedPaymentMode === "gcash" ? "text-white" : "text-black"
                  }`}
                >
                  GCash
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Book Ride Button */}
        <TouchableOpacity
          onPress={searchForDrivers}
          className={`rounded-xl py-4 ${
            pickupLocation && dropoffLocation ? "bg-black" : "bg-gray-300"
          }`}
          disabled={!pickupLocation || !dropoffLocation}
        >
          <Text
            className={`text-center font-semibold ${
              pickupLocation && dropoffLocation ? "text-white" : "text-gray-500"
            }`}
          >
            Book Ride
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderDriverSearchStep = () => (
    <View className="flex-1 justify-center items-center p-6">
      <View className="bg-white rounded-2xl p-8 items-center">
        <ActivityIndicator size="large" color="#000000" />
        <Text className="text-black text-lg font-semibold mt-4 mb-2">
          Finding nearby drivers...
        </Text>
        <Text className="text-gray-600 text-center">
          Please wait while we search for available tricycles in your area
        </Text>

        <TouchableOpacity
          onPress={() => setCurrentStep("location-selection")}
          className="mt-6 px-6 py-2 border border-gray-300 rounded-lg"
        >
          <Text className="text-gray-600">Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDriverFoundStep = () => (
    <View className="flex-1 bg-white">
      <View className="p-6 border-b border-gray-200">
        <Text className="text-black text-lg font-semibold mb-2">Available Drivers</Text>
        <Text className="text-gray-600">Choose your preferred driver</Text>
      </View>

      <ScrollView className="flex-1 p-6">
        {availableDrivers.map((driver) => (
          <TouchableOpacity
            key={driver.id}
            onPress={() => bookRideWithDriver(driver)}
            className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-200"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-gray-300 rounded-full mr-4 items-center justify-center">
                <Ionicons name="person" size={24} color="#6b7280" />
              </View>

              <View className="flex-1">
                <Text className="text-black font-semibold">{driver.name}</Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="star" size={16} color="#fbbf24" />
                  <Text className="text-gray-600 ml-1">{driver.rating}</Text>
                  <Text className="text-gray-400 mx-2">•</Text>
                  <Text className="text-gray-600">{driver.vehicleNumber}</Text>
                </View>
                <Text className="text-gray-500 text-sm mt-1">
                  {driver.estimatedArrival} mins away
                </Text>
              </View>

              <View className="items-end">
                <Text className="text-black font-bold">₱{estimatedFare}</Text>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View className="p-6">
        <TouchableOpacity
          onPress={() => setCurrentStep("location-selection")}
          className="bg-gray-200 rounded-xl py-3"
        >
          <Text className="text-center text-gray-700 font-medium">Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRideTrackingStep = () => (
    <View className="flex-1 bg-white">
      {/* Map showing driver location */}
      <View className="flex-1">
        <MapView
          ref={mapRef}
          center={selectedDriver?.location}
          markers={[
            ...(pickupLocation
              ? [
                  {
                    id: "pickup",
                    location: pickupLocation,
                    title: "Pickup Location",
                    color: "#22c55e",
                  },
                ]
              : []),
            ...(selectedDriver
              ? [
                  {
                    id: "driver",
                    location: selectedDriver.location,
                    title: selectedDriver.name,
                    color: "#3b82f6",
                  },
                ]
              : []),
          ]}
          height={400}
          className="flex-1"
        />
      </View>

      {/* Ride Info Panel */}
      <View className="bg-white p-6 border-t border-gray-200">
        <View className="items-center mb-4">
          <Text className="text-black text-lg font-semibold">{rideStatus}</Text>
          {selectedDriver && (
            <Text className="text-gray-600">
              {selectedDriver.name} • {selectedDriver.vehicleNumber}
            </Text>
          )}
        </View>

        <View className="flex-row justify-between items-center mb-4">
          <View className="items-center">
            <Ionicons name="time" size={24} color="#6b7280" />
            <Text className="text-gray-600 text-sm mt-1">ETA</Text>
            <Text className="text-black font-semibold">
              {selectedDriver?.estimatedArrival} mins
            </Text>
          </View>

          <View className="items-center">
            <Ionicons name="cash" size={24} color="#6b7280" />
            <Text className="text-gray-600 text-sm mt-1">Fare</Text>
            <Text className="text-black font-semibold">₱{estimatedFare}</Text>
          </View>

          <TouchableOpacity className="items-center">
            <Ionicons name="call" size={24} color="#22c55e" />
            <Text className="text-gray-600 text-sm mt-1">Call</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={cancelRide}
          className="bg-red-50 border border-red-200 rounded-xl py-3"
        >
          <Text className="text-center text-red-600 font-medium">Cancel Ride</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-black px-6 py-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">Book a Ride</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content based on current step */}
      {currentStep === "location-selection" && renderLocationSelectionStep()}
      {currentStep === "driver-search" && renderDriverSearchStep()}
      {currentStep === "driver-found" && renderDriverFoundStep()}
      {currentStep === "ride-tracking" && renderRideTrackingStep()}

      {/* Location Picker Modal */}
      <Modal visible={showLocationPicker} animationType="slide" presentationStyle="fullScreen">
        <LocationPicker
          title={
            locationPickerType === "pickup" ? "Select Pickup Location" : "Select Dropoff Location"
          }
          placeholder={locationPickerType === "pickup" ? "Where are you?" : "Where to?"}
          onLocationSelect={handleLocationConfirm}
          onCancel={() => setShowLocationPicker(false)}
          initialLocation={
            locationPickerType === "pickup"
              ? pickupLocation || undefined
              : dropoffLocation || undefined
          }
        />
      </Modal>
    </SafeAreaView>
  );
}
