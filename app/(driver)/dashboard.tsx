import { useAuth } from "@/src/contexts/AuthContext";
import { driverService, type Driver } from "@/src/services/driver.service";
import { rideService, type Ride } from "@/src/services/ride.service";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface DashboardStats {
  todayEarnings: number;
  todayTrips: number;
  onlineHours: number;
  weeklyEarnings: number;
  totalRating: number;
  totalTrips: number;
}

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    todayEarnings: 0,
    todayTrips: 0,
    onlineHours: 0,
    weeklyEarnings: 0,
    totalRating: 5.0,
    totalTrips: 0,
  });
  const [pendingRides, setPendingRides] = useState<Ride[]>([]);
  const [driverProfile, setDriverProfile] = useState<Driver | null>(null);
  const [onlineStartTime, setOnlineStartTime] = useState<Date | null>(null);

  // Load dashboard data on mount and user change
  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  // Update online hours every minute when available
  useEffect(() => {
    let interval: any;

    if (isAvailable && onlineStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const hoursOnline = (now.getTime() - onlineStartTime.getTime()) / (1000 * 60 * 60);
        setStats((prev) => ({ ...prev, onlineHours: Math.round(hoursOnline * 10) / 10 }));
      }, 60000); // Update every minute
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAvailable, onlineStartTime]);

  const loadDashboardData = async (refresh = false) => {
    if (!user?.id) return;

    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Load driver profile and rides concurrently
      const [profileResponse, ridesResponse] = await Promise.all([
        driverService.getDriverById(
          user.id,
          "id,userId,username,address,age,contactNumber,licensePhoto,validIdPhoto,isVerified,user.firstName,user.lastName,user.email"
        ),
        rideService.getRidesByDriver(user.id, {
          page: 1,
          limit: 50,
          status: undefined, // Get all rides for stats calculation
          fields:
            "id,pickup,dropoff,fare,paymentMode,status,createdAt,passenger.firstName,passenger.lastName",
        }),
      ]);

      if (profileResponse.success && profileResponse.data) {
        const profile = profileResponse.data;
        setDriverProfile(profile);

        // If driver was online but is no longer verified, force them offline
        if (isAvailable && !profile.isVerified) {
          setIsAvailable(false);
          setOnlineStartTime(null);
          Alert.alert(
            "Account Verification Required",
            "Your account verification status has changed. You have been taken offline."
          );
        }
      }

      if (ridesResponse.success && ridesResponse.data) {
        const rides = ridesResponse.data;

        // Calculate today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayRides = rides.filter((ride) => {
          const rideDate = new Date(ride.createdAt);
          rideDate.setHours(0, 0, 0, 0);
          return rideDate.getTime() === today.getTime() && ride.status === "completed";
        });

        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());

        const weekRides = rides.filter((ride) => {
          const rideDate = new Date(ride.createdAt);
          return rideDate >= weekStart && ride.status === "completed";
        });

        const pendingRidesList = rides.filter((ride) => ride.status === "pending");

        setStats({
          todayEarnings: todayRides.reduce((sum, ride) => sum + ride.fare, 0),
          todayTrips: todayRides.length,
          onlineHours: stats.onlineHours, // Keep current online hours
          weeklyEarnings: weekRides.reduce((sum, ride) => sum + ride.fare, 0),
          totalRating: 5.0, // TODO: Calculate from ratings
          totalTrips: rides.filter((ride) => ride.status === "completed").length,
        });

        setPendingRides(pendingRidesList);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      Alert.alert("Error", "Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(onboarding)/welcome");
        },
      },
    ]);
  };

  const toggleAvailability = async () => {
    // Check if driver profile is loaded
    if (!driverProfile) {
      Alert.alert("Error", "Driver profile not loaded. Please refresh and try again.");
      return;
    }

    // Check if driver is verified
    if (!driverProfile.isVerified) {
      // Check what's missing for verification
      const missingRequirements = [];
      if (!driverProfile.licensePhoto) missingRequirements.push("• Upload driver's license");
      if (!driverProfile.validIdPhoto) missingRequirements.push("• Upload valid ID");
      if (!driverProfile.username || !driverProfile.address || !driverProfile.contactNumber) {
        missingRequirements.push("• Complete profile information");
      }

      const requirementsText =
        missingRequirements.length > 0
          ? `Please complete the following requirements:\n\n${missingRequirements.join("\n")}`
          : "Your account is pending verification. Please contact support if this issue persists.";

      Alert.alert("Account Verification Required", requirementsText, [
        { text: "OK", style: "default" },
        {
          text: "Go to Profile",
          onPress: () => router.push("/(driver)/profile"),
        },
      ]);
      return;
    }

    const newStatus = !isAvailable;

    if (newStatus) {
      // Going online
      try {
        const response = await driverService.updateDriverStatus(true);

        if (response.success) {
          setOnlineStartTime(new Date());
          setIsAvailable(true);
          Alert.alert("Status Updated", "You are now online and ready to accept ride requests!");
        } else {
          Alert.alert("Error", response.message || "Failed to go online");
        }
      } catch (error) {
        console.error("Error going online:", error);
        Alert.alert("Error", "Failed to update status. Please try again.");
      }
    } else {
      // Going offline
      Alert.alert(
        "Go Offline",
        "Are you sure you want to go offline? You won't receive new ride requests.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go Offline",
            onPress: async () => {
              try {
                const response = await driverService.updateDriverStatus(false);

                if (response.success) {
                  setIsAvailable(false);
                  setOnlineStartTime(null);
                  Alert.alert("Status Updated", "You are now offline.");
                } else {
                  Alert.alert("Error", response.message || "Failed to go offline");
                }
              } catch (error) {
                console.error("Error going offline:", error);
                Alert.alert("Error", "Failed to update status. Please try again.");
              }
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadDashboardData(true)}
            colors={["#000000"]}
          />
        }
      >
        {/* Header */}
        <View className="bg-black px-6 py-8 rounded-b-3xl mb-2">
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold">
                Welcome back, {user?.firstName || "Driver"}! 🚗
              </Text>
              <Text className="text-white/80 mt-1">
                {driverProfile?.isVerified ? "Account Verified" : "Account Pending Verification"}
              </Text>
            </View>
          </View>

          {/* Availability Toggle */}
          <View className="bg-white/10 rounded-2xl p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="">
                  <Text className="text-white font-semibold text-lg">
                    {isAvailable ? "You're Online" : "You're Offline"}
                  </Text>
                </View>
                <Text className="text-white/80 mt-1">
                  {isAvailable
                    ? `Online for ${stats.onlineHours}h - Ready to accept rides`
                    : "Go online to start earning"}
                </Text>
                {pendingRides.length > 0 && (
                  <Text className="text-yellow-300 text-sm mt-1 font-medium">
                    {pendingRides.length} pending ride request{pendingRides.length > 1 ? "s" : ""}
                  </Text>
                )}
              </View>
              <Switch
                value={isAvailable}
                onValueChange={toggleAvailability}
                trackColor={{ false: "#6b7280", true: "#22c55e" }}
                thumbColor={isAvailable ? "#ffffff" : "#9CA3AF"}
                disabled={!driverProfile?.isVerified || isLoading}
              />
            </View>
            {!driverProfile?.isVerified && (
              <TouchableOpacity
                onPress={() => router.push("/(driver)/profile")}
                className="mt-3 p-3 bg-yellow-500/20 rounded-xl border border-yellow-500/30"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-yellow-200 text-sm font-medium">
                      ⚠️ Account Verification Required
                    </Text>
                    <Text className="text-yellow-200/80 text-xs mt-1">
                      {!driverProfile?.licensePhoto || !driverProfile?.validIdPhoto
                        ? "Upload required documents to get verified"
                        : "Verification pending - contact support if needed"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(254, 240, 138, 0.8)" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats Cards */}
        <View className="px-6 -mt-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <View className=" mb-4">
              <Text className="text-black text-lg font-semibold">Today&apos;s Summary</Text>
            </View>

            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-black">₱{stats.todayEarnings}</Text>
                <Text className="text-gray-500 text-sm">Earnings</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-black">{stats.todayTrips}</Text>
                <Text className="text-gray-500 text-sm">Trips</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-black">{stats.onlineHours}h</Text>
                <Text className="text-gray-500 text-sm">Online</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pending Rides Alert */}
        {pendingRides.length > 0 && (
          <View className="px-6 mt-6">
            <TouchableOpacity
              onPress={() => router.push("/(driver)/ride-requests")}
              className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex-row items-center"
              activeOpacity={0.8}
            >
              <View className="w-12 h-12 bg-yellow-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="notifications" size={24} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="text-yellow-800 font-semibold">
                  {pendingRides.length} New Ride Request{pendingRides.length > 1 ? "s" : ""}
                </Text>
                <Text className="text-yellow-600 text-sm">Tap to view and accept rides</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#f59e0b" />
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View className="px-6 mt-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-black text-lg font-semibold mb-4">Quick Actions</Text>

            <View className="space-y-4 gap-3">
              <TouchableOpacity
                onPress={() => router.push("/(driver)/ride-requests")}
                className="flex-row items-center p-4 bg-gray-100 rounded-xl"
                activeOpacity={0.8}
              >
                <View className="w-12 h-12 bg-gray-200 rounded-full items-center justify-center mr-4">
                  <Ionicons name="notifications" size={24} color="#000000" />
                </View>
                <View className="flex-1">
                  <Text className="text-black font-medium">Ride Requests</Text>
                  <Text className="text-gray-500 text-sm">
                    {pendingRides.length > 0
                      ? `${pendingRides.length} pending request${pendingRides.length > 1 ? "s" : ""}`
                      : "View pending ride requests"}
                  </Text>
                </View>
                {pendingRides.length > 0 && (
                  <View className="bg-red-500 rounded-full w-6 h-6 items-center justify-center mr-2">
                    <Text className="text-white text-xs font-bold">{pendingRides.length}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="#000000" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(driver)/earnings")}
                className="flex-row items-center p-4 bg-gray-100 rounded-xl"
                activeOpacity={0.8}
              >
                <View className="w-12 h-12 bg-gray-200 rounded-full items-center justify-center mr-4">
                  <Ionicons name="wallet" size={24} color="#000000" />
                </View>
                <View className="flex-1">
                  <Text className="text-black font-medium">Earnings</Text>
                  <Text className="text-gray-500 text-sm">₱{stats.weeklyEarnings} this week</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#000000" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(driver)/profile")}
                className="flex-row items-center p-4 bg-gray-100 rounded-xl"
                activeOpacity={0.8}
              >
                <View className="w-12 h-12 bg-gray-200 rounded-full items-center justify-center mr-4">
                  <Ionicons name="person" size={24} color="#000000" />
                </View>
                <View className="flex-1">
                  <Text className="text-black font-medium">Profile & Vehicle</Text>
                  <Text className="text-gray-500 text-sm">
                    {driverProfile?.isVerified ? "Verified account" : "Complete verification"}
                  </Text>
                </View>
                {!driverProfile?.isVerified && (
                  <View className="bg-yellow-500 rounded-full w-6 h-6 items-center justify-center mr-2">
                    <Ionicons name="warning" size={12} color="white" />
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Driver Status */}
        <View className="px-6 mt-6 mb-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-black text-lg font-semibold mb-4">Driver Status</Text>

            <View className="space-y-3 gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons
                    name={driverProfile?.isVerified ? "checkmark-circle" : "time"}
                    size={20}
                    color={driverProfile?.isVerified ? "#22c55e" : "#f59e0b"}
                  />
                  <Text className="text-black ml-3">Account Status</Text>
                </View>
                <Text
                  className={`font-medium ${driverProfile?.isVerified ? "text-green-600" : "text-yellow-600"}`}
                >
                  {driverProfile?.isVerified ? "Verified" : "Pending"}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="star" size={20} color="#f59e0b" />
                  <Text className="text-black ml-3">Rating</Text>
                </View>
                <Text className="text-gray-600 font-medium">{stats.totalRating} ⭐</Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="car" size={20} color="#6b7280" />
                  <Text className="text-black ml-3">Total Trips</Text>
                </View>
                <Text className="text-gray-600 font-medium">{stats.totalTrips}</Text>
              </View>

              {driverProfile?.vehicle && (
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="medal" size={20} color="#6b7280" />
                    <Text className="text-black ml-3">Vehicle</Text>
                  </View>
                  <Text className="text-gray-600 font-medium">
                    {driverProfile.vehicle.plateNumber}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
