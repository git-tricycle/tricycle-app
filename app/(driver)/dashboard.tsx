import { useAuth } from '@/src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/(onboarding)/welcome');
  };

  const toggleAvailability = () => {
    setIsAvailable(!isAvailable);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-green-600 px-6 py-8 rounded-b-3xl">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-white/80 text-base">Welcome back,</Text>
              <Text className="text-white text-2xl font-bold">
                Driver {user?.firstName || 'User'}! 🚗
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleLogout}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            >
              <Ionicons name="log-out" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Availability Toggle */}
          <View className="bg-white/10 rounded-2xl p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white font-semibold text-lg">
                  {isAvailable ? 'You\'re Online' : 'You\'re Offline'}
                </Text>
                <Text className="text-white/80">
                  {isAvailable ? 'Ready to accept rides' : 'Go online to start earning'}
                </Text>
              </View>
              <Switch
                value={isAvailable}
                onValueChange={toggleAvailability}
                trackColor={{ false: '#374151', true: '#10B981' }}
                thumbColor={isAvailable ? '#ffffff' : '#9CA3AF'}
              />
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View className="px-6 -mt-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-gray-900 text-lg font-semibold mb-4">Today's Summary</Text>
            
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-green-600">₱0</Text>
                <Text className="text-gray-500 text-sm">Earnings</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-blue-600">0</Text>
                <Text className="text-gray-500 text-sm">Trips</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-purple-600">0h</Text>
                <Text className="text-gray-500 text-sm">Online</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mt-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-gray-900 text-lg font-semibold mb-4">Quick Actions</Text>
            
            <View className="space-y-4">
              <TouchableOpacity
                onPress={() => router.push('/(driver)/ride-requests')}
                className="flex-row items-center p-4 bg-gray-50 rounded-xl"
                activeOpacity={0.8}
              >
                <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="notifications" size={24} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">Ride Requests</Text>
                  <Text className="text-gray-500 text-sm">View pending ride requests</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(driver)/earnings')}
                className="flex-row items-center p-4 bg-gray-50 rounded-xl"
                activeOpacity={0.8}
              >
                <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="wallet" size={24} color="#059669" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">Earnings</Text>
                  <Text className="text-gray-500 text-sm">View your earnings history</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(driver)/profile')}
                className="flex-row items-center p-4 bg-gray-50 rounded-xl"
                activeOpacity={0.8}
              >
                <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="person" size={24} color="#7C3AED" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">Profile</Text>
                  <Text className="text-gray-500 text-sm">Manage your account</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Driver Status */}
        <View className="px-6 mt-6 mb-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-gray-900 text-lg font-semibold mb-4">Driver Status</Text>
            
            <View className="space-y-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                  <Text className="text-gray-700 ml-3">Account Verified</Text>
                </View>
                <Text className="text-green-600 font-medium">Active</Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="star" size={20} color="#F59E0B" />
                  <Text className="text-gray-700 ml-3">Rating</Text>
                </View>
                <Text className="text-gray-600 font-medium">5.0 ⭐</Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="car" size={20} color="#6B7280" />
                  <Text className="text-gray-700 ml-3">Total Trips</Text>
                </View>
                <Text className="text-gray-600 font-medium">0</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
