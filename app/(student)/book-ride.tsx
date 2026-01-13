import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Image,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, {
  Location,
  MapViewRef,
  MapPolyline,
} from "@/src/components/ui/MapView";
import LocationPicker from "@/src/components/ui/LocationPicker";
import ShareTripModal from "@/src/components/ShareTripModal";
import { useAuth } from "@/src/contexts/AuthContext";
import { rideService } from "@/src/services/ride.service";
import { driverService } from "@/src/services/driver.service";
import { getRouteBetween } from "@/src/services/directions.service";
import { fareService } from "@/src/services/fare.service";
import {
  socketService,
  type RideLocationUpdate,
  type RideStatusUpdate,
} from "@/src/services";
import { AlertModal, type AlertType } from "@/src/components/AlertModal";
import { ConfirmModal } from "@/src/components/ConfirmModal";

type BookingStep =
  | "location-selection"
  | "driver-search"
  | "driver-found"
  | "awaiting-driver"
  | "ride-tracking";

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
  const motorbikeIcon = useMemo(() => {
    if (Platform.OS === "web") {
      return require("@/assets/images/motorbike.png");
    }
    return Image.resolveAssetSource(require("@/assets/images/motorbike.png"))
      .uri;
  }, []);

  // Booking state
  const [currentStep, setCurrentStep] =
    useState<BookingStep>("location-selection");
  const [pickupLocation, setPickupLocation] = useState<BookingLocation | null>(
    null,
  );
  const [dropoffLocation, setDropoffLocation] =
    useState<BookingLocation | null>(null);
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [selectedPaymentMode] = useState<"cash">("cash");

  // Location picker state
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationPickerType, setLocationPickerType] = useState<
    "pickup" | "dropoff"
  >("pickup");

  // Driver search state
  const [isSearchingDriver, setIsSearchingDriver] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Ride state
  const [currentRide, setCurrentRide] = useState<any>(null);
  const [rideStatus, setRideStatus] = useState<string>("");
  const [isConnectedToSocket, setIsConnectedToSocket] = useState(false);
  const [routePolylines, setRoutePolylines] = useState<MapPolyline[]>([]);
  const lastRouteKeyRef = useRef<string | null>(null);
  const lastDriverLocationRef = useRef<Location | null>(null);

  // Share Trip state
  const [showShareModal, setShowShareModal] = useState(false);

  // Alert modal state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
  }>({
    visible: false,
    type: "info",
    title: "",
    message: "",
  });

  // Confirmation modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Calculate estimated fare when locations are set
  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      calculateEstimatedFare();
    }
  }, [pickupLocation, dropoffLocation]);

  // Reset to default state when component mounts (when navigating to book-ride)
  useEffect(() => {
    // Only reset if there's no active ongoing ride
    if (
      !currentRide?.id ||
      currentRide.status === "completed" ||
      currentRide.status === "cancelled"
    ) {
      resetRideState();
    }
  }, []); // Run only on mount

  // Socket.IO real-time ride updates - replaces polling
  useEffect(() => {
    if (!currentRide?.id) {
      return;
    }

    const isTerminalStatus =
      currentRide.status === "completed" || currentRide.status === "cancelled";

    if (isTerminalStatus) {
      setIsConnectedToSocket(false);
      return;
    }

    let isActive = true;

    // Connect to Socket.IO and join ride room
    const connectAndJoinRide = async () => {
      try {
        // Connect to socket if not already connected
        if (!socketService.isConnected()) {
          await socketService.connect();
        }

        if (!isActive) return;

        // Join the ride room
        socketService.joinRide(currentRide.id);
        setIsConnectedToSocket(true);

        // Listen for location updates
        const handleLocationUpdate = (data: RideLocationUpdate) => {
          if (data.rideId === currentRide.id && isActive) {
            console.log("Real-time location update:", data.location);
            updateDriverLocationOnMap(data.location);
          }
        };

        // Listen for status updates
        const handleStatusUpdate = async (data: RideStatusUpdate) => {
          if (data.rideId === currentRide.id && isActive) {
            console.log("Real-time status update:", data.status);

            // Fetch updated ride data
            const response = await rideService.getRideById(currentRide.id);
            if (response.success && response.data && isActive) {
              // Check if driver cancelled the ride
              if (
                data.status === "cancelled" &&
                currentRide.status !== "cancelled"
              ) {
                await handleRideStatusUpdate(response.data);
                // Show cancellation alert
                showAlert(
                  "Ride Cancelled",
                  "The driver has cancelled this ride. Please book another ride.",
                  "warning",
                );
                setCurrentStep("location-selection");
                resetRideState();
                return;
              }

              // Handle other status updates
              await handleRideStatusUpdate(response.data);
            }
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
          socketService.leaveRide(currentRide.id);
          setIsConnectedToSocket(false);
        };
      } catch (error) {
        console.error("Failed to connect to Socket.IO:", error);
        setIsConnectedToSocket(false);
      }
    };

    const cleanup = connectAndJoinRide();

    return () => {
      isActive = false;
      cleanup.then((cleanupFn) => cleanupFn?.());
    };
  }, [currentRide?.id]);

  const calculateEstimatedFare = async () => {
    try {
      let distance;
      let estimatedTime;

      // Try to get actual route distance first
      try {
        const routeCoordinates = await getRouteBetween(
          pickupLocation!,
          dropoffLocation!,
        );

        if (routeCoordinates.length > 1) {
          // Calculate distance along the actual route
          distance = calculateRouteDistance(routeCoordinates);
          // Estimate time based on average tricycle speed (28 km/h)
          estimatedTime = Math.max(3, Math.ceil((distance / 28) * 60 + 2)); // minutes
        } else {
          // Fallback to straight-line distance
          distance = calculateDistance(pickupLocation!, dropoffLocation!);
          estimatedTime = Math.max(3, Math.ceil((distance / 28) * 60 + 2));
        }
      } catch (routeError) {
        console.warn(
          "Route calculation failed, using straight-line distance:",
          routeError,
        );
        // Fallback to straight-line distance
        distance = calculateDistance(pickupLocation!, dropoffLocation!);
        estimatedTime = Math.max(3, Math.ceil((distance / 28) * 60 + 2));
      }

      // Call API with distance and estimated time
      const response = await fareService.calculateFare(distance, {
        estimatedTime,
      });

      if (response.success && response.data) {
        setEstimatedFare(Math.round(response.data.calculatedFare));
      } else {
        // Fallback to hardcoded values if API fails
        const baseFare = 15;
        const perKmRate = 8;
        const fare = baseFare + distance * perKmRate;
        setEstimatedFare(Math.round(fare));
      }
    } catch (error) {
      console.error("Error calculating fare:", error);
      // Fallback to hardcoded values
      const distance = calculateDistance(pickupLocation!, dropoffLocation!);
      const baseFare = 15;
      const perKmRate = 8;
      const fare = baseFare + distance * perKmRate;
      setEstimatedFare(Math.round(fare));
    }
  };

  const calculateDistance = (
    location1: Location,
    location2: Location,
  ): number => {
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
    return R * c; // Distance in km
  };

  const hasLocationChangedSignificantly = (
    oldLocation: Location | null,
    newLocation: Location,
  ): boolean => {
    if (!oldLocation) return true;

    const distance = calculateDistance(oldLocation, newLocation);
    // Only update if driver moved more than 10 meters (0.01 km)
    return distance > 0.01;
  };

  const calculateRouteDistance = (coordinates: Location[]): number => {
    let totalDistance = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      totalDistance += calculateDistance(coordinates[i], coordinates[i + 1]);
    }
    return totalDistance;
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

  const handleLocationSelect = (type: "pickup" | "dropoff") => {
    console.log("handleLocationSelect called with type:", type);
    setLocationPickerType(type);
    setShowLocationPicker(true);
  };

  const handleLocationConfirm = (location: BookingLocation) => {
    console.log("Location confirmed:", { type: locationPickerType, location });
    if (locationPickerType === "pickup") {
      setPickupLocation(location);
      console.log("Set pickup location:", location);
    } else {
      setDropoffLocation(location);
      console.log("Set dropoff location:", location);
    }
    setShowLocationPicker(false);
  };

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
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setConfirmConfig({
      visible: true,
      title,
      message,
      onConfirm,
    });
  };

  const searchForDrivers = async () => {
    console.log("searchForDrivers called", {
      pickupLocation,
      dropoffLocation,
      user: !!user,
    });
    if (!pickupLocation || !dropoffLocation || !user) {
      console.log("Missing required data:", {
        hasPickup: !!pickupLocation,
        hasDropoff: !!dropoffLocation,
        hasUser: !!user,
      });
      showAlert("Error", "Please select both pickup and dropoff locations");
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
        const drivers: Driver[] = response.data.map((driver) => {
          // Calculate accurate ETA based on driver location and pickup location
          let estimatedArrival = driver.estimatedArrival;
          if (driver.location && pickupLocation) {
            const distance = calculateDistance(driver.location, pickupLocation);
            const avgSpeed = 28; // km/h
            estimatedArrival = Math.max(
              3,
              Math.ceil((distance / avgSpeed) * 60 + 2),
            ); // min
          }

          return {
            id: driver.id,
            name: driver.name,
            rating: driver.rating,
            vehicleNumber: driver.vehicleNumber,
            estimatedArrival,
            location: driver.location
              ? {
                  latitude: driver.location.latitude,
                  longitude: driver.location.longitude,
                }
              : pickupLocation, // Use pickup location as fallback
            photo: undefined,
          };
        });

        setAvailableDrivers(drivers);
        setCurrentStep("driver-found");
      } else {
        showAlert(
          "No Drivers Available",
          "Sorry, there are no available drivers in your area at the moment. Please try again later.",
          "warning",
        );
        setCurrentStep("location-selection");
      }
    } catch (error) {
      console.error("Error searching for drivers:", error);
      showAlert(
        "Error",
        "Failed to find available drivers. Please check your internet connection and try again.",
        "error",
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
        setCurrentStep("awaiting-driver");
        setRideStatus("Waiting for driver to accept your request...");
      } else {
        showAlert("Error", response.message || "Failed to book ride", "error");
      }
    } catch (error) {
      showAlert("Error", "Failed to book ride. Please try again.", "error");
      console.error("Booking error:", error);
    }
  };

  async function handleRideStatusUpdate(ride: any) {
    setCurrentRide(ride);

    switch (ride.status) {
      case "accepted":
        setRideStatus("Driver accepted your ride. Preparing live tracking...");
        await ensureDriverDetails(ride, { forceRefresh: true });
        setCurrentStep("ride-tracking");
        break;
      case "in_progress":
        setRideStatus("Ride is now in progress");
        await ensureDriverDetails(ride, { forceRefresh: true });
        setCurrentStep("ride-tracking");
        break;
      case "completed":
        // Reset state first, then redirect to dashboard
        resetRideState();
        // Use setTimeout to ensure state reset is applied before navigation
        setTimeout(() => {
          router.replace("/(student)/dashboard");
        }, 100);
        break;
      case "cancelled":
        setRideStatus("This ride was cancelled.");
        setCurrentStep("location-selection");
        resetRideState();
        break;
      default:
        setRideStatus("Waiting for driver to accept your request...");
        break;
    }
  }

  async function ensureDriverDetails(
    ride: any,
    options: {
      forceRefresh?: boolean;
    } = {},
  ) {
    const { forceRefresh = false } = options;

    try {
      if (!ride?.driverId) {
        return;
      }

      const existingDriverIsMatch = selectedDriver?.id === ride.driverId;

      // Don't refresh if driver hasn't changed and location exists
      if (!forceRefresh && existingDriverIsMatch && selectedDriver?.location) {
        return;
      }

      // Attempt to enrich driver information from backend
      const driverProfileResponse = await driverService.getDriverById(
        ride.driverId,
        [
          "id",
          "userId",
          "contactNumber",
          "user.firstName",
          "user.lastName",
          "user.email",
          "user.location.latitude",
          "user.location.longitude",
          "vehicle.plateNumber",
          "vehicle.bodyNumber",
        ].join(","),
      );

      if (!driverProfileResponse.success || !driverProfileResponse.data) {
        return;
      }

      const driverProfile = driverProfileResponse.data as any;
      const driverName = selectedDriver?.name
        ? selectedDriver.name
        : `${driverProfile?.user?.firstName || "Driver"} ${
            driverProfile?.user?.lastName || ""
          }`.trim();

      const fallbackLocation = pickupLocation
        ? {
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude,
          }
        : { latitude: 13.92077, longitude: 122.09891 };

      const newLocation = driverProfile?.user?.location
        ? {
            latitude: driverProfile.user.location.latitude,
            longitude: driverProfile.user.location.longitude,
          }
        : selectedDriver?.location || fallbackLocation;

      // Only update if location changed significantly (> 10 meters)
      const shouldUpdate = hasLocationChangedSignificantly(
        lastDriverLocationRef.current,
        newLocation,
      );

      if (shouldUpdate) {
        lastDriverLocationRef.current = newLocation;
        setSelectedDriver({
          id: ride.driverId,
          name: driverName,
          rating: selectedDriver?.rating || 4.8,
          vehicleNumber:
            driverProfile?.vehicle?.plateNumber ||
            driverProfile?.vehicle?.bodyNumber ||
            selectedDriver?.vehicleNumber ||
            "N/A",
          estimatedArrival: selectedDriver?.estimatedArrival || ride.eta || 0,
          location: newLocation,
          photo: selectedDriver?.photo,
        });
      }
    } catch (error) {
      console.error("Failed to enrich driver details:", error);
    }
  }

  // Update driver location on map from real-time Socket.IO updates
  function updateDriverLocationOnMap(location: Location) {
    if (!location || !pickupLocation || !dropoffLocation) {
      return;
    }

    // Check if location changed significantly (> 10 meters)
    const shouldUpdate = hasLocationChangedSignificantly(
      lastDriverLocationRef.current,
      location,
    );

    if (!shouldUpdate) {
      return;
    }

    lastDriverLocationRef.current = location;

    // Update selected driver location
    if (selectedDriver) {
      setSelectedDriver({
        ...selectedDriver,
        location: location,
        estimatedArrival: calculateETA(location, pickupLocation),
      });
    }

    // Update route polylines if needed
    const routeKey = `${location.latitude}-${location.longitude}-${pickupLocation.latitude}-${pickupLocation.longitude}`;

    if (lastRouteKeyRef.current !== routeKey) {
      lastRouteKeyRef.current = routeKey;

      // Debounce route calculation
      setTimeout(async () => {
        try {
          const route = await getRouteBetween(location, pickupLocation);
          if (route && route.length > 0) {
            setRoutePolylines([
              {
                id: "driver-to-pickup",
                path: route,
                color: "#000000",
                weight: 4,
              },
            ]);
          }
        } catch (error) {
          console.error("Failed to update route:", error);
        }
      }, 1000);
    }
  }

  function resetRideState() {
    setSelectedDriver(null);
    setCurrentRide(null);
    setRideStatus("");
    setRoutePolylines([]);
    setCurrentStep("location-selection");
    setPickupLocation(null);
    setDropoffLocation(null);
    setEstimatedFare(null);
    setIsSearchingDriver(false);
    setAvailableDrivers([]);
    lastRouteKeyRef.current = null;
    lastDriverLocationRef.current = null;
  }

  const cancelRide = () => {
    const performCancel = async () => {
      try {
        if (currentRide?.id) {
          await rideService.cancelRide(currentRide.id);
        }
      } catch (error) {
        console.error("Failed to cancel ride:", error);
      } finally {
        setCurrentStep("location-selection");
        resetRideState();
      }
    };

    showConfirm(
      "Cancel Ride",
      "Are you sure you want to cancel this ride?",
      performCancel,
    );
  };

  const renderAwaitingDriverStep = () => (
    <View className="flex-1 justify-center items-center p-6 bg-white">
      <ActivityIndicator size="large" color="#000000" />
      <Text className="text-black text-lg font-semibold mt-4 mb-2">
        Waiting for driver confirmation
      </Text>
      <Text className="text-gray-600 text-center">
        We&apos;ve sent your ride request to{" "}
        {selectedDriver?.name || "the driver"}. You&apos;ll be notified once
        they accept.
      </Text>
      <View className="mt-6">
        <Text className="text-gray-500 text-sm text-center">{rideStatus}</Text>
        {isConnectedToSocket && (
          <View className="flex-row items-center justify-center mt-2">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            <Text className="text-gray-400 text-xs text-center">
              Real-time tracking active
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        onPress={cancelRide}
        className="mt-8 px-6 py-3 border border-gray-300 rounded-xl"
      >
        <Text className="text-gray-700 font-medium">Cancel Request</Text>
      </TouchableOpacity>
    </View>
  );

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
          style={
            Platform.OS === "web" ? ({ cursor: "pointer" } as any) : undefined
          }
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
          style={
            Platform.OS === "web" ? ({ cursor: "pointer" } as any) : undefined
          }
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
              <Text className="text-black font-bold text-lg">
                ₱{estimatedFare}
              </Text>
            </View>

            {/* Payment Mode - Cash Only */}
            <View className="p-4 rounded-lg border border-gray-300 bg-gray-50">
              <View className="flex-row items-center justify-center">
                <Text className="text-gray-700 font-medium">
                  Payment Method: Cash
                </Text>
              </View>
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
          style={
            Platform.OS === "web"
              ? ({
                  cursor: (pickupLocation && dropoffLocation
                    ? "pointer"
                    : "not-allowed") as any,
                  userSelect: "none" as any,
                  outline: "none" as any,
                } as any)
              : undefined
          }
          activeOpacity={0.8}
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
        <Text className="text-black text-lg font-semibold mb-2">
          Available Drivers
        </Text>
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

  const updateRoutePolylines = useCallback(
    async (driverLocationOverride?: Location) => {
      const driverLoc =
        driverLocationOverride || selectedDriver?.location || null;

      const segments: Array<{
        id: string;
        from: Location;
        to: Location;
        color: string;
        weight: number;
      }> = [];

      if (
        driverLoc &&
        pickupLocation &&
        currentRide?.status !== "in_progress"
      ) {
        segments.push({
          id: "driver-to-pickup",
          from: driverLoc,
          to: pickupLocation,
          color: "#22c55e",
          weight: 8,
        });
      }

      if (pickupLocation && dropoffLocation) {
        segments.push({
          id: "pickup-to-dropoff",
          from: pickupLocation,
          to: dropoffLocation,
          color: "#2563eb",
          weight: 6,
        });
      }

      if (
        driverLoc &&
        dropoffLocation &&
        currentRide?.status === "in_progress"
      ) {
        segments.push({
          id: "driver-to-dropoff",
          from: driverLoc,
          to: dropoffLocation,
          color: "#22c55e",
          weight: 8,
        });
      }

      if (segments.length === 0) {
        setRoutePolylines([]);
        lastRouteKeyRef.current = null;
        return;
      }

      const rounded = (value: number) => value.toFixed(5);
      const routeKey = segments
        .map(
          (segment) =>
            `${segment.id}:${rounded(segment.from.latitude)},${rounded(segment.from.longitude)}->${rounded(segment.to.latitude)},${rounded(segment.to.longitude)}`,
        )
        .join("|");

      if (routeKey === lastRouteKeyRef.current) {
        return;
      }

      const routes = await Promise.all(
        segments.map(async (segment) => {
          const path = await getRouteBetween(segment.from, segment.to);
          if (path.length < 2) {
            return null;
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
      setRoutePolylines(validRoutes);
      lastRouteKeyRef.current = routeKey;
    },
    [
      currentRide?.status,
      dropoffLocation,
      pickupLocation,
      selectedDriver?.location,
    ],
  );

  // Debounced route update - only update when necessary
  useEffect(() => {
    // Add debounce to prevent excessive updates
    const timeoutId = setTimeout(() => {
      updateRoutePolylines();
    }, 1000); // Wait 1 second before updating routes

    return () => clearTimeout(timeoutId);
  }, [
    selectedDriver?.location,
    pickupLocation,
    dropoffLocation,
    currentRide?.status,
    updateRoutePolylines,
  ]);

  const renderRideTrackingStep = () => {
    const fallbackCenter = { latitude: 13.92077, longitude: 122.09891 };
    const mapCenter =
      selectedDriver?.location ||
      pickupLocation ||
      dropoffLocation ||
      fallbackCenter;

    const markers = [
      ...(pickupLocation
        ? [
            {
              id: "pickup",
              location: pickupLocation,
              title: "Pickup Location",
              color: "#22c55e",
            } as const,
          ]
        : []),
      ...(dropoffLocation
        ? [
            {
              id: "dropoff",
              location: dropoffLocation,
              title: "Dropoff Location",
              color: "#ef4444",
            } as const,
          ]
        : []),
      ...(selectedDriver?.location
        ? [
            {
              id: "driver",
              location: selectedDriver.location,
              title: selectedDriver.name,
              color: "#3b82f6",
            } as const,
          ]
        : []),
    ];

    let polylinesToRender = routePolylines;

    if (polylinesToRender.length === 0) {
      const fallbackSegments: MapPolyline[] = [];

      if (selectedDriver?.location && pickupLocation) {
        fallbackSegments.push({
          id: "driver-to-pickup-fallback",
          path: [
            {
              latitude: selectedDriver.location.latitude,
              longitude: selectedDriver.location.longitude,
            },
            {
              latitude: pickupLocation.latitude,
              longitude: pickupLocation.longitude,
            },
          ],
          color: "#22c55e",
          weight: 4,
        });
      }

      if (pickupLocation && dropoffLocation) {
        fallbackSegments.push({
          id: "pickup-to-dropoff-fallback",
          path: [
            {
              latitude: pickupLocation.latitude,
              longitude: pickupLocation.longitude,
            },
            {
              latitude: dropoffLocation.latitude,
              longitude: dropoffLocation.longitude,
            },
          ],
          color: "#2563eb",
          weight: 4,
        });
      }

      if (
        selectedDriver?.location &&
        dropoffLocation &&
        currentRide?.status === "in_progress"
      ) {
        fallbackSegments.push({
          id: "driver-to-dropoff-fallback",
          path: [
            {
              latitude: selectedDriver.location.latitude,
              longitude: selectedDriver.location.longitude,
            },
            {
              latitude: dropoffLocation.latitude,
              longitude: dropoffLocation.longitude,
            },
          ],
          color: "#22c55e",
          weight: 4,
        });
      }

      polylinesToRender = fallbackSegments;
    }

    return (
      <View className="flex-1 bg-white">
        {/* Map showing driver location */}
        <View className="flex-1">
          <MapView
            ref={mapRef}
            center={mapCenter}
            markers={markers}
            polylines={polylinesToRender}
            height={400}
            className="flex-1"
          />
        </View>

        {/* Ride Info Panel */}
        <View className="bg-white p-6 border-t border-gray-200">
          <View className="items-center mb-4">
            <Text className="text-black text-lg font-semibold">
              {rideStatus}
            </Text>
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
                {selectedDriver?.location && pickupLocation
                  ? `${calculateETA(
                      selectedDriver.location,
                      currentRide?.status === "in_progress" && dropoffLocation
                        ? dropoffLocation
                        : pickupLocation,
                    )} mins`
                  : `${selectedDriver?.estimatedArrival || 0} mins`}
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

          {/* Share Trip Button */}
          {(currentRide?.status === "accepted" ||
            currentRide?.status === "in_progress") && (
            <TouchableOpacity
              onPress={() => setShowShareModal(true)}
              className="bg-blue-50 border border-blue-200 rounded-xl py-3 mb-3 flex-row items-center justify-center"
            >
              <Ionicons name="share-social" size={20} color="#2563eb" />
              <Text className="text-center text-blue-600 font-medium ml-2">
                Share Trip
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={cancelRide}
            className="bg-red-50 border border-red-200 rounded-xl py-3"
          >
            <Text className="text-center text-red-600 font-medium">
              Cancel Ride
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
      {currentStep === "awaiting-driver" && renderAwaitingDriverStep()}
      {currentStep === "ride-tracking" && renderRideTrackingStep()}

      {/* Share Trip Modal */}
      {currentRide && (
        <ShareTripModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          rideId={currentRide.id}
          rideDetails={{
            pickup:
              pickupLocation?.address ||
              currentRide.pickup ||
              "Pickup location",
            dropoff:
              dropoffLocation?.address ||
              currentRide.dropoff ||
              "Dropoff location",
            status: currentRide.status,
          }}
        />
      )}

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
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
      >
        <LocationPicker
          title={
            locationPickerType === "pickup"
              ? "Select Pickup Location"
              : "Select Dropoff Location"
          }
          placeholder={
            locationPickerType === "pickup" ? "Where are you?" : "Where to?"
          }
          onLocationSelect={handleLocationConfirm}
          onCancel={() => setShowLocationPicker(false)}
          initialLocation={
            locationPickerType === "pickup"
              ? pickupLocation || undefined
              : dropoffLocation || undefined
          }
        />
      </Modal>

      {/* Alert Modal */}
      <AlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        visible={confirmConfig.visible}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText="Yes"
        cancelText="No"
        onConfirm={() => {
          setConfirmConfig({ ...confirmConfig, visible: false });
          confirmConfig.onConfirm();
        }}
        onCancel={() => setConfirmConfig({ ...confirmConfig, visible: false })}
        destructive={true}
        icon="warning"
      />
    </SafeAreaView>
  );
}
