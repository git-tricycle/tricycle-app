import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart, BarChart } from "react-native-chart-kit";
import { Colors } from "@/src/constants/theme";
import { rideService } from "@/src/services/ride.service";
import { userService } from "@/src/services/user.service";
import { driverService } from "@/src/services/driver.service";
import { studentService } from "@/src/services/student.service";

interface ReportsStats {
  totalRevenue: number;
  totalRides: number;
  activeDrivers: number;
  averageFare: number;
  previousPeriodRevenue: number;
  previousPeriodRides: number;
  previousPeriodDrivers: number;
  previousPeriodFare: number;
}

interface TopDriver {
  id: string;
  name: string;
  rides: number;
  earnings: number;
}

export default function ReportsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month" | "year">("week");
  const [stats, setStats] = useState<ReportsStats>({
    totalRevenue: 0,
    totalRides: 0,
    activeDrivers: 0,
    averageFare: 0,
    previousPeriodRevenue: 0,
    previousPeriodRides: 0,
    previousPeriodDrivers: 0,
    previousPeriodFare: 0,
  });
  const [topDrivers, setTopDrivers] = useState<TopDriver[]>([]);
  const [chartData, setChartData] = useState({
    revenue: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
    },
    rides: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
    },
  });

  const loadReportsData = async () => {
    try {
      setIsLoading(true);

      // Get date ranges based on selected period
      const { currentStart, currentEnd, previousStart, previousEnd } =
        getDateRanges(selectedPeriod);

      // Fetch all data in parallel for better performance
      const [currentRidesResponse, previousRidesResponse, driversResponse, usersResponse] =
        await Promise.all([
          rideService.getRides({
            fields: "id,fare,status,createdAt,driverId,passengerId,passenger,driver",
            limit: 1000,
            // Note: Add date filtering when API supports it
          }),
          rideService.getRides({
            fields: "id,fare,status,createdAt,driverId,passengerId",
            limit: 1000,
            // Note: Add previous period date filtering when API supports it
          }),
          driverService.getDrivers({
            limit: 1000,
            fields: "id,userId,username,isVerified",
          }),
          userService.getUsers({
            limit: 1000,
            fields: "id,firstName,lastName,role,status,createdAt",
          }),
        ]);

      if (
        currentRidesResponse.success &&
        previousRidesResponse.success &&
        driversResponse.success &&
        usersResponse.success
      ) {
        const currentRides = currentRidesResponse.data || [];
        const previousRides = previousRidesResponse.data || [];
        const drivers = driversResponse.data || [];
        const users = usersResponse.data || [];

        // Filter rides by period (client-side filtering until API supports date filtering)
        const filteredCurrentRides = filterRidesByPeriod(currentRides, currentStart, currentEnd);
        const filteredPreviousRides = filterRidesByPeriod(
          previousRides,
          previousStart,
          previousEnd
        );

        // Calculate current period stats
        const completedCurrentRides = filteredCurrentRides.filter((r) => r.status === "completed");
        const totalRevenue = completedCurrentRides.reduce((sum, ride) => sum + (ride.fare || 0), 0);
        const totalRides = completedCurrentRides.length;
        const averageFare = totalRides > 0 ? totalRevenue / totalRides : 0;

        // Calculate previous period stats for trends
        const completedPreviousRides = filteredPreviousRides.filter(
          (r) => r.status === "completed"
        );
        const previousPeriodRevenue = completedPreviousRides.reduce(
          (sum, ride) => sum + (ride.fare || 0),
          0
        );
        const previousPeriodRides = completedPreviousRides.length;
        const previousPeriodFare =
          previousPeriodRides > 0 ? previousPeriodRevenue / previousPeriodRides : 0;

        // Calculate active drivers (drivers with rides in current period)
        const activeDriverIds = new Set(
          filteredCurrentRides.map((r) => r.driverId).filter(Boolean)
        );
        const activeDrivers = activeDriverIds.size;

        // Calculate top performing drivers
        const driverStats = calculateTopDrivers(completedCurrentRides, users, drivers);

        const newStats = {
          totalRevenue,
          totalRides,
          activeDrivers,
          averageFare,
          previousPeriodRevenue,
          previousPeriodRides,
          previousPeriodDrivers: new Set(
            completedPreviousRides.map((r) => r.driverId).filter(Boolean)
          ).size,
          previousPeriodFare,
        };

        setStats(newStats);
        setTopDrivers(driverStats);

        // Generate chart data
        const newChartData = generateChartData(currentRides, selectedPeriod);
        setChartData(newChartData);
      } else {
        console.error("Some API calls failed:", {
          currentRides: currentRidesResponse.success,
          previousRides: previousRidesResponse.success,
          drivers: driversResponse.success,
          users: usersResponse.success,
        });

        // Log the actual error responses for debugging
        if (!currentRidesResponse.success) {
          console.error("Current Rides Error:", currentRidesResponse);
        }
        if (!driversResponse.success) {
          console.error("Drivers Error:", driversResponse);
        }
        if (!usersResponse.success) {
          console.error("Users Error:", usersResponse);
        }

        Alert.alert("Warning", "Some data could not be loaded. Please try refreshing.");
      }
    } catch (error) {
      console.error("Error loading reports data:", error);
      Alert.alert("Error", "Failed to load reports data");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReportsData();
  };

  const getDateRanges = (period: "today" | "week" | "month" | "year") => {
    const now = new Date();
    let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;

    switch (period) {
      case "today":
        currentStart = new Date(now);
        currentStart.setHours(0, 0, 0, 0);
        currentEnd = new Date(now);
        currentEnd.setHours(23, 59, 59, 999);

        previousStart = new Date(currentStart);
        previousStart.setDate(previousStart.getDate() - 1);
        previousEnd = new Date(currentEnd);
        previousEnd.setDate(previousEnd.getDate() - 1);
        break;

      case "week":
        // Last 7 days (more practical for reports)
        currentEnd = new Date(now);
        currentEnd.setHours(23, 59, 59, 999);
        currentStart = new Date(now);
        currentStart.setDate(now.getDate() - 6); // Last 7 days including today
        currentStart.setHours(0, 0, 0, 0);

        // Previous 7 days
        previousEnd = new Date(currentStart);
        previousEnd.setDate(currentStart.getDate() - 1);
        previousEnd.setHours(23, 59, 59, 999);
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousEnd.getDate() - 6);
        previousStart.setHours(0, 0, 0, 0);
        break;

      case "month":
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;

      case "year":
        currentStart = new Date(now.getFullYear(), 0, 1);
        currentEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

        previousStart = new Date(now.getFullYear() - 1, 0, 1);
        previousEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        break;
    }

    return { currentStart, currentEnd, previousStart, previousEnd };
  };

  const filterRidesByPeriod = (rides: any[], startDate: Date, endDate: Date) => {
    return rides.filter((ride) => {
      const rideDate = new Date(ride.createdAt);
      return rideDate >= startDate && rideDate <= endDate;
    });
  };

  const calculateTopDrivers = (rides: any[], users: any[], drivers: any[]): TopDriver[] => {
    // Create maps for quick lookup
    const userMap = new Map(users.map((user) => [user.id, user]));
    const driverMap = new Map(drivers.map((driver) => [driver.userId, driver]));

    // Group rides by driver
    const driverStats = new Map<string, { rides: number; earnings: number }>();

    rides.forEach((ride) => {
      if (ride.driverId) {
        const current = driverStats.get(ride.driverId) || { rides: 0, earnings: 0 };
        current.rides += 1;
        current.earnings += ride.fare || 0;
        driverStats.set(ride.driverId, current);
      }
    });

    // Convert to TopDriver array and sort by earnings
    const topDrivers: TopDriver[] = [];

    driverStats.forEach((stats, driverId) => {
      // Try to get user info from the ride data first (if included), then from users array
      let driverName = "Unknown Driver";

      // Check if any ride has driver info
      const rideWithDriver = rides.find((r) => r.driverId === driverId && r.driver);
      if (rideWithDriver && rideWithDriver.driver) {
        driverName = `${rideWithDriver.driver.firstName} ${rideWithDriver.driver.lastName}`;
      } else {
        // Fallback to user lookup
        const user = userMap.get(driverId);
        if (user) {
          driverName = `${user.firstName} ${user.lastName}`;
        }
      }

      topDrivers.push({
        id: driverId,
        name: driverName,
        rides: stats.rides,
        earnings: stats.earnings,
      });
    });

    return topDrivers.sort((a, b) => b.earnings - a.earnings).slice(0, 5); // Top 5 drivers
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(change * 10) / 10),
      isPositive: change >= 0,
    };
  };

  const generateChartData = (rides: any[], period: "today" | "week" | "month" | "year") => {
    const now = new Date();
    let labels: string[] = [];
    let revenueData: number[] = [];
    let ridesData: number[] = [];

    if (period === "week") {
      // Last 7 days
      labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const dailyStats = new Map();

      // Initialize all days with 0
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayKey = date.toISOString().split("T")[0];
        dailyStats.set(dayKey, { revenue: 0, rides: 0 });
      }

      // Aggregate rides by day
      rides.forEach((ride) => {
        if (ride.status === "completed") {
          const rideDate = new Date(ride.createdAt);
          const dayKey = rideDate.toISOString().split("T")[0];
          if (dailyStats.has(dayKey)) {
            const current = dailyStats.get(dayKey);
            current.revenue += ride.fare || 0;
            current.rides += 1;
          }
        }
      });

      // Convert to arrays
      revenueData = Array.from(dailyStats.values()).map((stat) => stat.revenue);
      ridesData = Array.from(dailyStats.values()).map((stat) => stat.rides);
    } else if (period === "month") {
      // Last 4 weeks
      labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
      const weeklyStats = [0, 0, 0, 0].map(() => ({ revenue: 0, rides: 0 }));

      rides.forEach((ride) => {
        if (ride.status === "completed") {
          const rideDate = new Date(ride.createdAt);
          const weeksDiff = Math.floor(
            (now.getTime() - rideDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
          );
          if (weeksDiff >= 0 && weeksDiff < 4) {
            weeklyStats[3 - weeksDiff].revenue += ride.fare || 0;
            weeklyStats[3 - weeksDiff].rides += 1;
          }
        }
      });

      revenueData = weeklyStats.map((stat) => stat.revenue);
      ridesData = weeklyStats.map((stat) => stat.rides);
    } else if (period === "year") {
      // Last 12 months
      labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyStats = new Array(12).fill(0).map(() => ({ revenue: 0, rides: 0 }));

      rides.forEach((ride) => {
        if (ride.status === "completed") {
          const rideDate = new Date(ride.createdAt);
          const monthIndex = rideDate.getMonth();
          monthlyStats[monthIndex].revenue += ride.fare || 0;
          monthlyStats[monthIndex].rides += 1;
        }
      });

      revenueData = monthlyStats.map((stat) => stat.revenue);
      ridesData = monthlyStats.map((stat) => stat.rides);
    } else {
      // Today - hourly data
      labels = ["6AM", "9AM", "12PM", "3PM", "6PM", "9PM"];
      const hourlyStats = new Array(6).fill(0).map(() => ({ revenue: 0, rides: 0 }));

      rides.forEach((ride) => {
        if (ride.status === "completed") {
          const rideDate = new Date(ride.createdAt);
          const hour = rideDate.getHours();
          let timeSlot = -1;
          if (hour >= 6 && hour < 9) timeSlot = 0;
          else if (hour >= 9 && hour < 12) timeSlot = 1;
          else if (hour >= 12 && hour < 15) timeSlot = 2;
          else if (hour >= 15 && hour < 18) timeSlot = 3;
          else if (hour >= 18 && hour < 21) timeSlot = 4;
          else if (hour >= 21 || hour < 6) timeSlot = 5;

          if (timeSlot >= 0) {
            hourlyStats[timeSlot].revenue += ride.fare || 0;
            hourlyStats[timeSlot].rides += 1;
          }
        }
      });

      revenueData = hourlyStats.map((stat) => stat.revenue);
      ridesData = hourlyStats.map((stat) => stat.rides);
    }

    return {
      revenue: {
        labels,
        datasets: [{ data: revenueData.length > 0 ? revenueData : [0] }],
      },
      rides: {
        labels,
        datasets: [{ data: ridesData.length > 0 ? ridesData : [0] }],
      },
    };
  };

  useEffect(() => {
    loadReportsData();
  }, [selectedPeriod]);

  const StatCard = ({
    title,
    value,
    icon,
    color = Colors.light.tint,
    trend,
  }: {
    title: string;
    value: string | number;
    icon: string;
    color?: string;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex-1 mx-1">
      <View className="flex-row items-center justify-between mb-2">
        <View
          className={`w-10 h-10 rounded-lg items-center justify-center`}
          style={{ backgroundColor: color + "20" }}
        >
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        {trend && (
          <View
            className={`flex-row items-center px-2 py-1 rounded-full ${
              trend.isPositive ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <Ionicons
              name={trend.isPositive ? "trending-up" : "trending-down"}
              size={12}
              color={trend.isPositive ? "#10B981" : "#EF4444"}
            />
            <Text
              className={`text-xs font-medium ml-1 ${
                trend.isPositive ? "text-green-700" : "text-red-700"
              }`}
            >
              {Math.abs(trend.value)}%
            </Text>
          </View>
        )}
      </View>
      <Text className="text-2xl font-bold text-gray-900 mb-1">{value}</Text>
      <Text className="text-sm text-gray-600">{title}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900 mb-4">Reports & Analytics</Text>

        {/* Period Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-2 gap-3">
            {[
              { key: "year", label: "This Year" },
              { key: "month", label: "This Month" },
              { key: "week", label: "This Week" },
              { key: "today", label: "Today" },
            ].map((period) => (
              <TouchableOpacity
                key={period.key}
                className={`px-4 py-2 rounded-full ${
                  selectedPeriod === period.key ? "bg-blue-600" : "bg-gray-200"
                }`}
                onPress={() => {
                  setSelectedPeriod(period.key as any);
                  // Data will reload automatically via useEffect
                }}
              >
                <Text
                  className={`font-medium ${
                    selectedPeriod === period.key ? "text-white" : "text-gray-700"
                  }`}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading && !refreshing ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={Colors.light.tint} />
            <Text className="text-gray-600 mt-4">Loading reports...</Text>
          </View>
        ) : (
          <>
            {/* Key Metrics */}
            <View className="px-6 py-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</Text>

              {/* First Row */}
              <View className="flex-row mb-4">
                <StatCard
                  title="Total Revenue"
                  value={`₱${stats.totalRevenue.toLocaleString()}`}
                  icon="wallet"
                  color="#10B981"
                  trend={calculateTrend(stats.totalRevenue, stats.previousPeriodRevenue)}
                />
                <StatCard
                  title="Total Rides"
                  value={stats.totalRides.toLocaleString()}
                  icon="car"
                  color="#3B82F6"
                  trend={calculateTrend(stats.totalRides, stats.previousPeriodRides)}
                />
              </View>

              {/* Second Row */}
              <View className="flex-row mb-4">
                <StatCard
                  title="Active Drivers"
                  value={stats.activeDrivers.toLocaleString()}
                  icon="people"
                  color="#F59E0B"
                  trend={calculateTrend(stats.activeDrivers, stats.previousPeriodDrivers)}
                />
                <StatCard
                  title="Avg. Fare"
                  value={`₱${stats.averageFare.toFixed(2)}`}
                  icon="calculator"
                  color="#8B5CF6"
                  trend={calculateTrend(stats.averageFare, stats.previousPeriodFare)}
                />
              </View>
            </View>

            {/* Charts Section */}
            <View className="px-6 pb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Analytics</Text>

              {/* Revenue Chart */}
              <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
                <Text className="text-gray-900 font-semibold mb-3">Revenue Trend</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <LineChart
                    data={chartData.revenue}
                    width={Math.max(Dimensions.get("window").width - 80, 320)}
                    height={200}
                    chartConfig={{
                      backgroundColor: "#ffffff",
                      backgroundGradientFrom: "#ffffff",
                      backgroundGradientTo: "#ffffff",
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
                      style: {
                        borderRadius: 16,
                      },
                      propsForDots: {
                        r: "4",
                        strokeWidth: "2",
                        stroke: "#10B981",
                      },
                    }}
                    bezier
                    style={{
                      marginVertical: 8,
                      borderRadius: 16,
                    }}
                  />
                </ScrollView>
              </View>

              {/* Rides Chart */}
              <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
                <Text className="text-gray-900 font-semibold mb-3">Rides Overview</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <BarChart
                    data={chartData.rides}
                    width={Math.max(Dimensions.get("window").width - 80, 320)}
                    height={200}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={{
                      backgroundColor: "#ffffff",
                      backgroundGradientFrom: "#ffffff",
                      backgroundGradientTo: "#ffffff",
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
                      style: {
                        borderRadius: 16,
                      },
                    }}
                    style={{
                      marginVertical: 8,
                      borderRadius: 16,
                    }}
                  />
                </ScrollView>
              </View>

              {/* Top Performers */}
              <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <Text className="text-gray-900 font-semibold mb-3">Top Performing Drivers</Text>

                {topDrivers.length > 0 ? (
                  topDrivers.map((driver, index) => (
                    <View
                      key={driver.id}
                      className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <View className="flex-row items-center">
                        <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                          <Text className="text-blue-600 font-semibold">{index + 1}</Text>
                        </View>
                        <View>
                          <Text className="text-gray-900 font-medium">{driver.name}</Text>
                          <Text className="text-gray-600 text-sm">{driver.rides} rides</Text>
                        </View>
                      </View>
                      <Text className="text-gray-900 font-semibold">
                        ₱{driver.earnings.toLocaleString()}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View className="py-8 items-center">
                    <Ionicons name="car-outline" size={48} color="#9CA3AF" />
                    <Text className="text-gray-500 mt-2">No driver data available</Text>
                    <Text className="text-gray-400 text-sm">for the selected period</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
