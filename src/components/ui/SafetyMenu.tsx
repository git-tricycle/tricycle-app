import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, Modal, Share, Linking } from "react-native";

interface SafetyMenuProps {
  visible: boolean;
  onClose: () => void;
  rideId?: string;
  driverName?: string;
  vehicleNumber?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

export default function SafetyMenu({
  visible,
  onClose,
  rideId,
  driverName,
  vehicleNumber,
  currentLocation,
}: SafetyMenuProps) {
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);

  const handleSOS = () => {
    Alert.alert(
      "Emergency SOS",
      "This will immediately alert your emergency contacts and local authorities. Only use in real emergencies.\n\nAre you in immediate danger?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send SOS",
          style: "destructive",
          onPress: sendSOS,
        },
      ]
    );
  };

  const sendSOS = () => {
    // Start countdown
    setSosCountdown(5);

    const countdown = setInterval(() => {
      setSosCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdown);
          executeSOS();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    // Show option to cancel
    Alert.alert(
      "Sending SOS...",
      "Emergency alert will be sent in 5 seconds. Tap Cancel to stop.",
      [
        {
          text: "Cancel",
          onPress: () => {
            clearInterval(countdown);
            setSosCountdown(null);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const executeSOS = () => {
    // In a real app, this would:
    // 1. Send location to emergency contacts
    // 2. Contact local authorities
    // 3. Notify the ride platform
    // 4. Start recording audio/video if permissions allow

    Alert.alert(
      "SOS Sent!",
      "Emergency alert has been sent to your emergency contacts and authorities. Stay safe!"
    );

    // Mock emergency number call (in real app, use actual emergency number)
    // Linking.openURL('tel:911');
  };

  const shareTrip = async () => {
    try {
      const shareContent = {
        title: "Live Trip Tracking",
        message: rideId
          ? `I'm currently on a tricycle ride (ID: ${rideId}) with ${driverName} (${vehicleNumber}). You can track my trip live for safety.`
          : "I'm currently on a tricycle ride. Sharing for safety purposes.",
        url: currentLocation
          ? `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`
          : undefined,
      };

      await Share.share(shareContent);
    } catch (error) {
      console.error("Error sharing trip:", error);
    }
  };

  const callEmergencyContact = () => {
    Alert.alert("Emergency Contact", "Call your primary emergency contact?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Call",
        onPress: () => {
          // In real app, get from user profile
          const emergencyNumber = "+639123456789";
          Linking.openURL(`tel:${emergencyNumber}`);
        },
      },
    ]);
  };

  const reportIssue = () => {
    Alert.alert("Report Issue", "What type of issue do you want to report?", [
      { text: "Cancel", style: "cancel" },
      { text: "Unsafe Driving", onPress: () => reportDriverIssue("unsafe_driving") },
      { text: "Wrong Route", onPress: () => reportDriverIssue("wrong_route") },
      { text: "Vehicle Condition", onPress: () => reportDriverIssue("vehicle_condition") },
      { text: "Other", onPress: () => reportDriverIssue("other") },
    ]);
  };

  const reportDriverIssue = (issueType: string) => {
    // In real app, this would send a report to the platform
    Alert.alert(
      "Report Submitted",
      "Your report has been submitted and will be reviewed by our safety team."
    );
    onClose();
  };

  const openMaps = () => {
    if (currentLocation) {
      const url = `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`;
      Linking.openURL(url);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" transparent={true}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl px-6 py-8">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-black text-xl font-bold">Safety Menu</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
            >
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* SOS Button - Prominent */}
          <TouchableOpacity
            onPress={handleSOS}
            className="bg-red-500 rounded-xl p-6 mb-6 items-center"
          >
            <Ionicons name="warning" size={32} color="white" />
            <Text className="text-white text-lg font-bold mt-2">
              {sosCountdown !== null ? `Sending SOS in ${sosCountdown}...` : "Emergency SOS"}
            </Text>
            <Text className="text-red-100 text-sm text-center mt-1">
              Tap to alert emergency contacts & authorities
            </Text>
          </TouchableOpacity>

          {/* Safety Actions */}
          <View className="space-y-4 gap-4">
            <TouchableOpacity
              onPress={shareTrip}
              className="bg-blue-50 border border-blue-200 rounded-xl p-4"
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="share" size={24} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-black font-semibold">Share Live Trip</Text>
                  <Text className="text-gray-600 text-sm">
                    Send your location to friends & family
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={callEmergencyContact}
              className="bg-green-50 border border-green-200 rounded-xl p-4"
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="call" size={24} color="#22c55e" />
                </View>
                <View className="flex-1">
                  <Text className="text-black font-semibold">Call Emergency Contact</Text>
                  <Text className="text-gray-600 text-sm">Quick dial your emergency contact</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={openMaps}
              className="bg-gray-50 border border-gray-200 rounded-xl p-4"
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="map" size={24} color="#6b7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-black font-semibold">View in Maps</Text>
                  <Text className="text-gray-600 text-sm">Open your current location in maps</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={reportIssue}
              className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-yellow-100 rounded-full items-center justify-center mr-4">
                  <Ionicons name="flag" size={24} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="text-black font-semibold">Report Issue</Text>
                  <Text className="text-gray-600 text-sm">Report safety or service concerns</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Trip Info (if available) */}
          {rideId && (
            <View className="mt-6 pt-6 border-t border-gray-200">
              <Text className="text-gray-600 text-sm mb-2">Current Ride Info:</Text>
              <Text className="text-black text-sm">Ride ID: {rideId}</Text>
              {driverName && vehicleNumber && (
                <Text className="text-black text-sm">
                  Driver: {driverName} • {vehicleNumber}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
