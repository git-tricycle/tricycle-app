import { useAuth } from "@/src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { rideService, Ride } from "@/src/services/ride.service";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [recentRides, setRecentRides] = useState<Ride[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const handleBookRide = () => {
    router.push("/(student)/book-ride");
  };

  const handleViewHistory = () => {
    router.push("/(student)/ride-history");
  };

  const handleProfile = () => {
    router.push("/(student)/profile");
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(onboarding)/welcome");
  };

  // Load recent rides
  useEffect(() => {
    const loadRecentRides = async () => {
      if (!user?.id) return;

      try {
        setLoadingRecent(true);
        const response = await rideService.getRidesByPassenger(user.id, {
          page: 1,
          limit: 1, // Just get the most recent ride
          fields:
            "id,pickup,dropoff,fare,paymentMode,status,createdAt,driver.firstName,driver.lastName",
        });

        if (response.success && response.data) {
          setRecentRides(response.data);
        }
      } catch (error) {
        console.error("Error loading recent rides:", error);
      } finally {
        setLoadingRecent(false);
      }
    };

    loadRecentRides();
  }, [user?.id]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-black px-6 py-8 rounded-b-3xl mb-2">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white text-2xl font-bold">
                Good morning, {user?.firstName || "Student"}! 👋
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 -mt-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-black text-lg font-semibold mb-4">Quick Actions</Text>

            <TouchableOpacity
              onPress={handleBookRide}
              className="bg-black rounded-xl p-4 mb-4"
              activeOpacity={0.8}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4">
                  <Ionicons name="car" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-lg">Book a Ride</Text>
                  <Text className="text-white/80">Find a tricycle near you</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="white" />
              </View>
            </TouchableOpacity>

            <View className="flex-row space-x-4 gap-3">
              <TouchableOpacity
                onPress={handleViewHistory}
                className="flex-1 bg-gray-100 rounded-xl p-4"
                activeOpacity={0.8}
              >
                <View className="items-center">
                  <Ionicons name="time" size={24} color="#000000" />
                  <Text className="text-black font-medium mt-2">History</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleProfile}
                className="flex-1 bg-gray-100 rounded-xl p-4"
                activeOpacity={0.8}
              >
                <View className="items-center">
                  <Ionicons name="person" size={24} color="#000000" />
                  <Text className="text-black font-medium mt-2">Profile</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View className="px-6 mt-6">
          <View className="bg-white rounded-2xl p-2 shadow-sm">
            <View className="mb-4">
              <Text className="text-black text-lg font-semibold">Recent Activity</Text>
            </View>

            {loadingRecent ? (
              <View className="border border-gray-200 rounded-xl p-4 mb-3 items-center">
                <ActivityIndicator size="small" color="#000" />
                <Text className="text-gray-500 text-sm mt-2">Loading recent activity...</Text>
              </View>
            ) : recentRides.length > 0 ? (
              <View className="border border-gray-200 rounded-xl p-4 mb-3">
                {recentRides.map((ride) => {
                  const getStatusColor = () => {
                    switch (ride.status) {
                      case "completed":
                        return "bg-green-500";
                      case "cancelled":
                        return "bg-red-500";
                      case "in_progress":
                        return "bg-blue-500";
                      case "accepted":
                        return "bg-yellow-500";
                      default:
                        return "bg-gray-500";
                    }
                  };

                  const getStatusText = () => {
                    switch (ride.status) {
                      case "completed":
                        return "Completed";
                      case "cancelled":
                        return "Cancelled";
                      case "in_progress":
                        return "In Progress";
                      case "accepted":
                        return "Accepted";
                      default:
                        return "Pending";
                    }
                  };

                  const getStatusTextColor = () => {
                    switch (ride.status) {
                      case "completed":
                        return "text-green-600";
                      case "cancelled":
                        return "text-red-600";
                      case "in_progress":
                        return "text-blue-600";
                      case "accepted":
                        return "text-yellow-600";
                      default:
                        return "text-gray-600";
                    }
                  };

                  const formatDate = (dateString: string) => {
                    const date = new Date(dateString);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - date.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 1) return "Today";
                    if (diffDays === 2) return "Yesterday";
                    return `${diffDays} days ago`;
                  };

                  return (
                    <View key={ride.id}>
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-row items-center">
                          <View className={`w-2 h-2 ${getStatusColor()} rounded-full mr-2`} />
                          <Text className={`${getStatusTextColor()} font-medium text-sm`}>
                            {getStatusText()}
                          </Text>
                        </View>
                        <Text className="text-gray-500 text-sm">{formatDate(ride.createdAt)}</Text>
                      </View>

                      <View className="mb-2">
                        <View className="flex-row items-center mb-1">
                          <View className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                          <Text className="text-gray-800 text-sm flex-1">{ride.pickup}</Text>
                        </View>
                        <View className="ml-5 border-l border-dashed border-gray-300 h-3" />
                        <View className="flex-row items-center">
                          <View className="w-2 h-2 bg-red-500 rounded-full mr-3" />
                          <Text className="text-gray-800 text-sm flex-1">{ride.dropoff}</Text>
                        </View>
                      </View>

                      <View className="flex-row justify-between items-center pt-2 border-t border-gray-100">
                        <Text className="text-gray-600 text-sm">
                          {ride.driver
                            ? `${ride.driver.firstName} ${ride.driver.lastName.charAt(0)}.`
                            : "No driver"}{" "}
                          • {ride.paymentMode}
                        </Text>
                        <Text className="text-black font-semibold">₱{ride.fare}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View className="border border-gray-200 rounded-xl p-4 mb-3 items-center">
                <Ionicons name="car-outline" size={24} color="#9CA3AF" />
                <Text className="text-gray-500 text-sm mt-2">No recent rides</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleBookRide}
              className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 items-center"
            >
              <Ionicons name="add" size={24} color="#6b7280" />
              <Text className="text-gray-600 text-sm mt-1">Book Another Ride</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Safety Features */}
        <View className="px-6 mt-6 mb-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-black text-lg font-semibold mb-4">Safety Features</Text>

            <View className="space-y-3 gap-5">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center mr-4">
                  <Ionicons name="alert-circle" size={20} color="#000000" />
                </View>
                <View className="flex-1">
                  <Text className="text-black font-medium">SOS Button</Text>
                  <Text className="text-gray-500 text-sm">Emergency alert system</Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center mr-4">
                  <Ionicons name="share" size={20} color="#000000" />
                </View>
                <View className="flex-1">
                  <Text className="text-black font-medium">Share Trip</Text>
                  <Text className="text-gray-500 text-sm">Share live location with contacts</Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center mr-4">
                  <Ionicons name="shield-checkmark" size={20} color="#000000" />
                </View>
                <View className="flex-1">
                  <Text className="text-black font-medium">Verified Drivers</Text>
                  <Text className="text-gray-500 text-sm">All drivers are background checked</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
