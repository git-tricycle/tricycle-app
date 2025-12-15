import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";

interface RideRatingProps {
  visible: boolean;
  rideId: string;
  driverName: string;
  vehicleNumber: string;
  fare: number;
  onSubmit: (rating: number, comment?: string) => Promise<void>;
  onClose: () => void;
}

export default function RideRating({
  visible,
  rideId,
  driverName,
  vehicleNumber,
  fare,
  onSubmit,
  onClose,
}: RideRatingProps) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarPress = (rating: number) => {
    setSelectedRating(rating);
  };

  const handleSubmit = async () => {
    if (selectedRating === 0) {
      Alert.alert("Rating Required", "Please select a rating before submitting.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(selectedRating, comment.trim() || undefined);

      // Reset form
      setSelectedRating(0);
      setComment("");
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to submit rating. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert("Skip Rating", "Are you sure you want to skip rating this ride?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Skip",
        onPress: () => {
          setSelectedRating(0);
          setComment("");
          onClose();
        },
      },
    ]);
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1:
        return "Poor";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Very Good";
      case 5:
        return "Excellent";
      default:
        return "Rate your experience";
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "web" ? undefined : "pageSheet"}
      transparent={true}
      style={
        Platform.OS === "web"
          ? {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }
          : undefined
      }
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl px-6 py-8">
          {/* Header */}
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="checkmark" size={32} color="#22c55e" />
            </View>
            <Text className="text-black text-xl font-bold mb-1">Ride Completed!</Text>
            <Text className="text-gray-600 text-center">How was your ride with {driverName}?</Text>
          </View>

          {/* Ride Summary */}
          <View className="bg-gray-50 rounded-xl p-4 mb-6">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-gray-600 text-sm">Driver & Vehicle</Text>
                <Text className="text-black font-medium">
                  {driverName} • {vehicleNumber}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-gray-600 text-sm">Total Fare</Text>
                <Text className="text-black font-bold text-lg">₱{fare}</Text>
              </View>
            </View>
          </View>

          {/* Rating Stars */}
          <View className="items-center mb-6">
            <Text className="text-black text-lg font-semibold mb-4">
              {getRatingText(selectedRating)}
            </Text>

            <View className="flex-row space-x-4 gap-4 mb-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  onPress={() => handleStarPress(rating)}
                  className="p-2"
                >
                  <Ionicons
                    name={selectedRating >= rating ? "star" : "star-outline"}
                    size={36}
                    color={selectedRating >= rating ? "#fbbf24" : "#d1d5db"}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Comment Input */}
          <View className="mb-6">
            <Text className="text-black font-medium mb-3">Leave a comment (optional)</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Tell us about your experience..."
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-black"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={200}
            />
            <Text className="text-gray-400 text-sm mt-1 text-right">{comment.length}/200</Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row space-x-3 gap-3">
            <TouchableOpacity
              onPress={handleSkip}
              className="flex-1 bg-gray-100 rounded-xl py-4"
              disabled={isSubmitting}
            >
              <Text className="text-center text-gray-700 font-medium">Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              className={`flex-1 rounded-xl py-4 ${
                selectedRating > 0 ? "bg-black" : "bg-gray-300"
              }`}
              disabled={selectedRating === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  className={`text-center font-semibold ${
                    selectedRating > 0 ? "text-white" : "text-gray-500"
                  }`}
                >
                  Submit Rating
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
