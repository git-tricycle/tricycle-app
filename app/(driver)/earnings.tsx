import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { rideService, type Ride } from "@/src/services/ride.service";

interface EarningsData {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  todayTrips: number;
  weekTrips: number;
  monthTrips: number;
  totalTrips: number;
  averagePerTrip: number;
}

interface EarningsBreakdown {
  cash: number;
  gcash: number;
  totalEarnings: number;
}

type TimePeriod = "today" | "week" | "month" | "all";

export default function EarningsScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("today");
  const [earnings, setEarnings] = useState<EarningsData>({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0,
    todayTrips: 0,
    weekTrips: 0,
    monthTrips: 0,
    totalTrips: 0,
    averagePerTrip: 0,
  });
  const [breakdown, setBreakdown] = useState<EarningsBreakdown>({
    cash: 0,
    gcash: 0,
    totalEarnings: 0,
  });
  const [recentRides, setRecentRides] = useState<Ride[]>([]);

  useEffect(() => {
    loadEarningsData();
  }, [user?.id]);

  const loadEarningsData = async (refresh = false) => {
    if (!user?.id) return;

    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await rideService.getRidesByDriver(user.id, {
        status: "completed",
        limit: 100, // Get more rides for comprehensive stats
        page: 1,
        fields:
          "id,pickup,dropoff,fare,paymentMode,status,createdAt,passenger.firstName,passenger.lastName",
      });

      if (response.success && response.data) {
        const completedRides = response.data;
        calculateEarnings(completedRides);
        setRecentRides(completedRides.slice(0, 10)); // Show last 10 rides
      }
    } catch (error) {
      console.error("Error loading earnings data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const calculateEarnings = (rides: Ride[]) => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter rides by time periods
    const todayRides = rides.filter((ride) => {
      const rideDate = new Date(ride.createdAt);
      return rideDate >= today;
    });

    const weekRides = rides.filter((ride) => {
      const rideDate = new Date(ride.createdAt);
      return rideDate >= thisWeekStart;
    });

    const monthRides = rides.filter((ride) => {
      const rideDate = new Date(ride.createdAt);
      return rideDate >= thisMonthStart;
    });

    // Calculate totals
    const todayEarnings = todayRides.reduce((sum, ride) => sum + ride.fare, 0);
    const weekEarnings = weekRides.reduce((sum, ride) => sum + ride.fare, 0);
    const monthEarnings = monthRides.reduce((sum, ride) => sum + ride.fare, 0);
    const totalEarnings = rides.reduce((sum, ride) => sum + ride.fare, 0);

    // Payment method breakdown
    const cashEarnings = rides
      .filter((ride) => ride.paymentMode === "cash")
      .reduce((sum, ride) => sum + ride.fare, 0);
    const gcashEarnings = rides
      .filter((ride) => ride.paymentMode === "gcash")
      .reduce((sum, ride) => sum + ride.fare, 0);

    setEarnings({
      today: todayEarnings,
      thisWeek: weekEarnings,
      thisMonth: monthEarnings,
      total: totalEarnings,
      todayTrips: todayRides.length,
      weekTrips: weekRides.length,
      monthTrips: monthRides.length,
      totalTrips: rides.length,
      averagePerTrip: rides.length > 0 ? totalEarnings / rides.length : 0,
    });

    setBreakdown({
      cash: cashEarnings,
      gcash: gcashEarnings,
      totalEarnings: totalEarnings,
    });
  };

  const getPeriodData = () => {
    switch (selectedPeriod) {
      case "today":
        return { amount: earnings.today, trips: earnings.todayTrips };
      case "week":
        return { amount: earnings.thisWeek, trips: earnings.weekTrips };
      case "month":
        return { amount: earnings.thisMonth, trips: earnings.monthTrips };
      case "all":
        return { amount: earnings.total, trips: earnings.totalTrips };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderRecentRide = ({ item }: { item: Ride }) => (
    <View className="bg-white mx-4 mb-3 rounded-xl p-4 border border-gray-100">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-gray-500 text-xs">{formatDate(item.createdAt)}</Text>
          <Text className="text-black font-medium" numberOfLines={1}>
            {item.pickup} → {item.dropoff}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-black text-lg font-bold">₱{item.fare}</Text>
          <View
            className={`px-2 py-1 rounded-full ${
              item.paymentMode === "cash" ? "bg-green-100" : "bg-blue-100"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                item.paymentMode === "cash" ? "text-green-700" : "text-blue-700"
              }`}
            >
              {item.paymentMode.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-black px-6 py-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">Earnings</Text>
        </View>

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#000" />
          <Text className="text-gray-500 mt-4">Loading earnings data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const periodData = getPeriodData();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-black px-6 py-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">Earnings</Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadEarningsData(true)}
            colors={["#000000"]}
          />
        }
      >
        {/* Period Selector */}
        <View className="px-6 py-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-3 gap-3">
              {[
                { key: "today", label: "Today" },
                { key: "week", label: "This Week" },
                { key: "month", label: "This Month" },
                { key: "all", label: "All Time" },
              ].map((period) => (
                <TouchableOpacity
                  key={period.key}
                  onPress={() => setSelectedPeriod(period.key as TimePeriod)}
                  className={`px-4 py-2 rounded-full ${
                    selectedPeriod === period.key ? "bg-black" : "bg-white border border-gray-300"
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      selectedPeriod === period.key ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Main Earnings Card */}
        <View className="px-6 mb-6">
          <View className="bg-black rounded-2xl p-6 text-center">
            <Text className="text-white/80 text-center mb-2">
              {selectedPeriod === "today"
                ? "Today"
                : selectedPeriod === "week"
                  ? "This Week"
                  : selectedPeriod === "month"
                    ? "This Month"
                    : "Total"}{" "}
              Earnings
            </Text>
            <Text className="text-white text-4xl font-bold text-center mb-4">
              ₱{periodData.amount.toFixed(2)}
            </Text>
            <View className="flex-row justify-center items-center">
              <Ionicons name="car" size={16} color="white" />
              <Text className="text-white/80 ml-2">
                {periodData.trips} trip{periodData.trips !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* Summary Stats */}
        <View className="px-6 mb-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-black text-lg font-semibold mb-4">Summary</Text>

            <View className="flex-row justify-between mb-4">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-black">₱{earnings.total}</Text>
                <Text className="text-gray-500 text-sm">Earned</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-black">{earnings.totalTrips}</Text>
                <Text className="text-gray-500 text-sm">Trips</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-black">
                  ₱{earnings.averagePerTrip.toFixed(0)}
                </Text>
                <Text className="text-gray-500 text-sm">Avg/Trip</Text>
              </View>
            </View>

            {/* Payment Method Breakdown */}
            <View className="border-t border-gray-100 pt-4">
              <Text className="text-gray-600 font-medium mb-3">Payment Methods</Text>
              <View className="flex-row justify-between">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                  <Text className="text-gray-600">Cash: ₱{breakdown.cash}</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
                  <Text className="text-gray-600">GCash: ₱{breakdown.gcash}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Rides */}
        <View className="px-6 mb-6">
          <View className="bg-white rounded-t-2xl p-6 shadow-sm">
            <Text className="text-black text-lg font-semibold mb-4">Recent Completed Rides</Text>
          </View>

          {recentRides.length === 0 ? (
            <View className="bg-white rounded-b-2xl p-6 pt-0 items-center">
              <Ionicons name="car-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-500 text-center mt-2">No completed rides yet</Text>
            </View>
          ) : (
            <View className="bg-gray-50 -mx-6 px-2 pb-4">
              <FlatList
                data={recentRides}
                keyExtractor={(item) => item.id}
                renderItem={renderRecentRide}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
