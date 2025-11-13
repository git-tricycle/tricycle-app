import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/src/contexts/AuthContext";
import { rideService } from "@/src/services/ride.service";

interface RideHistoryItem {
  id: string;
  pickup: string;
  dropoff: string;
  fare: number;
  paymentMode: string;
  status: "completed" | "cancelled";
  createdAt: string;
  driver?: {
    firstName: string;
    lastName: string;
  };
  rating?: {
    rating: number;
    comment?: string;
  };
}

export default function RideHistoryScreen() {
  const { user } = useAuth();
  const [rides, setRides] = useState<RideHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled">("all");

  useEffect(() => {
    loadRideHistory();
  }, [user]);

  const loadRideHistory = async (refresh = false) => {
    if (!user?.id) return;

    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await rideService.getRidesByPassenger(user.id, {
        status: filter === "all" ? undefined : filter,
        limit: 50,
        page: 1,
        fields:
          "id,pickup,dropoff,fare,paymentMode,status,createdAt,driver.firstName,driver.lastName,rating.rating,rating.comment",
      });

      if (response.success && response.data) {
        // Transform API data to match our interface
        const transformedRides: RideHistoryItem[] = response.data.map((ride) => ({
          id: ride.id,
          pickup: ride.pickup,
          dropoff: ride.dropoff,
          fare: ride.fare,
          paymentMode: ride.paymentMode,
          status: ride.status as "completed" | "cancelled",
          createdAt: ride.createdAt,
          driver: ride.driver
            ? {
                firstName: ride.driver.firstName,
                lastName: ride.driver.lastName,
              }
            : undefined,
          rating: ride.rating
            ? {
                rating: ride.rating.rating,
                comment: ride.rating.comment,
              }
            : undefined,
        }));

        const filteredRides =
          filter === "all"
            ? transformedRides
            : transformedRides.filter((ride) => ride.status === filter);

        setRides(filteredRides);
      }
    } catch (error) {
      console.error("Error loading ride history:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const renderRideItem = ({ item }: { item: RideHistoryItem }) => (
    <TouchableOpacity
      className="bg-white mx-6 mb-4 rounded-xl p-4 shadow-sm border border-gray-100"
      onPress={() => {
        // Navigate to ride details
        console.log("View ride details:", item.id);
      }}
    >
      {/* Status and Date */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center">
          <View
            className={`w-2 h-2 rounded-full mr-2 ${
              item.status === "completed" ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <Text
            className={`font-medium capitalize ${
              item.status === "completed" ? "text-green-600" : "text-red-600"
            }`}
          >
            {item.status}
          </Text>
        </View>
        <Text className="text-gray-500 text-sm">{formatDate(item.createdAt)}</Text>
      </View>

      {/* Route */}
      <View className="mb-3">
        <View className="flex-row items-center mb-2">
          <View className="w-3 h-3 bg-green-500 rounded-full mr-3" />
          <Text className="text-black font-medium flex-1" numberOfLines={1}>
            {item.pickup}
          </Text>
        </View>
        <View className="ml-6 border-l-2 border-dashed border-gray-300 h-4" />
        <View className="flex-row items-center">
          <View className="w-3 h-3 bg-red-500 rounded-full mr-3" />
          <Text className="text-black font-medium flex-1" numberOfLines={1}>
            {item.dropoff}
          </Text>
        </View>
      </View>

      {/* Bottom Info */}
      <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
        <View>
          {item.driver && (
            <Text className="text-gray-600 text-sm">
              Driver: {item.driver.firstName} {item.driver.lastName}
            </Text>
          )}
          <Text className="text-gray-500 text-sm capitalize">Paid via {item.paymentMode}</Text>
        </View>

        <View className="items-end">
          <Text className="text-black font-bold text-lg">₱{item.fare}</Text>
          {item.rating && (
            <View className="flex-row items-center">
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text className="text-gray-600 ml-1">{item.rating.rating}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-6">
      <Ionicons name="car-outline" size={64} color="#d1d5db" />
      <Text className="text-gray-500 text-lg font-medium mt-4 mb-2">No rides found</Text>
      <Text className="text-gray-400 text-center">
        {filter === "all" ? "You haven't taken any rides yet" : `No ${filter} rides found`}
      </Text>
      <TouchableOpacity
        onPress={() => router.push("/(student)/book-ride")}
        className="bg-black rounded-xl px-6 py-3 mt-6"
      >
        <Text className="text-white font-medium">Book Your First Ride</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && rides.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-black px-6 py-4 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">Ride History</Text>
          <View style={{ width: 24 }} />
        </View>

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#000000" />
          <Text className="text-gray-600 mt-4">Loading your rides...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-black px-6 py-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">Ride History</Text>
        <TouchableOpacity onPress={() => loadRideHistory(true)}>
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row space-x-4 gap-4">
          {(["all", "completed", "cancelled"] as const).map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => {
                setFilter(status);
                loadRideHistory();
              }}
              className={`px-4 py-2 rounded-lg ${filter === status ? "bg-black" : "bg-gray-100"}`}
            >
              <Text
                className={`font-medium capitalize ${
                  filter === status ? "text-white" : "text-gray-600"
                }`}
              >
                {status === "all" ? "All Rides" : status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Ride List */}
      {rides.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          renderItem={renderRideItem}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadRideHistory(true)}
              colors={["#000000"]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
