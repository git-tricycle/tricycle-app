import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  tripShareService,
  type TripShareResponse,
  type ActiveShare,
} from "@/src/services";

interface ShareTripModalProps {
  visible: boolean;
  onClose: () => void;
  rideId: string;
  rideDetails?: {
    pickup: string;
    dropoff: string;
    status: string;
  };
}

export default function ShareTripModal({
  visible,
  onClose,
  rideId,
  rideDetails,
}: ShareTripModalProps) {
  const [loading, setLoading] = useState(false);
  const [shareData, setShareData] = useState<TripShareResponse | null>(null);
  const [activeShares, setActiveShares] = useState<ActiveShare[]>([]);
  const [expirationHours, setExpirationHours] = useState(24);

  const loadActiveShares = useCallback(async () => {
    try {
      const response = await tripShareService.getActiveSharesByRide(rideId);
      if (response.success && response.data) {
        setActiveShares(response.data);
        // If there's an active share, use it
        if (response.data.length > 0) {
          const activeShare = response.data[0];
          setShareData({
            shareToken: activeShare.shareToken,
            shareUrl: activeShare.shareUrl,
            expiresAt: activeShare.expiresAt,
          });
        }
      }
    } catch (error) {
      console.error("Error loading active shares:", error);
    }
  }, [rideId]);

  useEffect(() => {
    if (visible && rideId) {
      loadActiveShares();
    }
  }, [visible, rideId, loadActiveShares]);

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const response = await tripShareService.generateShareLink({
        rideId,
        expirationHours,
      });

      if (response.success && response.data) {
        setShareData(response.data);
        Alert.alert("Success", "Share link generated successfully!");
        // Reload active shares
        await loadActiveShares();
      } else {
        Alert.alert(
          "Error",
          response.message || "Failed to generate share link",
        );
      }
    } catch (error) {
      console.error("Error generating share link:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleShareLink = async () => {
    if (!shareData) return;

    const message = `🚕 Track my tricycle ride in real-time!\n\nFrom: ${rideDetails?.pickup || "Pickup location"}\nTo: ${rideDetails?.dropoff || "Dropoff location"}\n\n👉 ${shareData.shareUrl}\n\nLink expires: ${new Date(shareData.expiresAt).toLocaleString()}`;

    try {
      if (Platform.OS === "web") {
        // For web, use navigator.clipboard
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareData.shareUrl);
          Alert.alert("Copied!", "Link copied to clipboard");
        } else {
          Alert.alert("Info", shareData.shareUrl);
        }
      } else {
        // For mobile, use Share API
        const result = await Share.share({
          message,
          title: "Track My Trip",
          url: shareData.shareUrl,
        });

        if (result.action === Share.sharedAction) {
          Alert.alert("Shared!", "Trip link shared successfully");
        }
      }
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("Error", "Failed to share link");
    }
  };

  const handleCopyLink = async () => {
    if (!shareData) return;

    try {
      if (Platform.OS === "web" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.shareUrl);
        Alert.alert("Copied!", "Link copied to clipboard");
      } else {
        // Fallback: show the URL in an alert
        Alert.alert("Share Link", shareData.shareUrl, [
          { text: "OK", style: "default" },
        ]);
      }
    } catch (error) {
      console.error("Error copying:", error);
      Alert.alert("Error", "Failed to copy link");
    }
  };

  const handleDeactivateLink = async (shareToken: string) => {
    Alert.alert(
      "Deactivate Share Link",
      "Are you sure you want to deactivate this share link? It will no longer be accessible.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            try {
              const response =
                await tripShareService.deactivateShareLink(shareToken);
              if (response.success) {
                Alert.alert("Success", "Share link deactivated");
                setShareData(null);
                await loadActiveShares();
              } else {
                Alert.alert(
                  "Error",
                  response.message || "Failed to deactivate link",
                );
              }
            } catch (error) {
              console.error("Error deactivating link:", error);
              Alert.alert("Error", "An unexpected error occurred");
            }
          },
        },
      ],
    );
  };

  const formatExpirationTime = (expiresAt: string) => {
    const expiration = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiration.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) return "Expired";
    if (diffHours > 0) return `Expires in ${diffHours}h ${diffMinutes}m`;
    return `Expires in ${diffMinutes}m`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-5 pb-10 max-h-[90%]">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-2xl font-bold text-gray-900">Share Trip</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Trip Details */}
          {rideDetails && (
            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="location" size={20} color="#4CAF50" />
                <Text
                  className="ml-2 text-sm text-gray-900 flex-1"
                  numberOfLines={1}
                >
                  {rideDetails.pickup}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="flag" size={20} color="#F44336" />
                <Text
                  className="ml-2 text-sm text-gray-900 flex-1"
                  numberOfLines={1}
                >
                  {rideDetails.dropoff}
                </Text>
              </View>
            </View>
          )}

          {/* Info Box */}
          <View className="flex-row items-center bg-blue-50 p-3 rounded-lg mb-5">
            <Ionicons name="information-circle" size={20} color="#2196F3" />
            <Text className="ml-2 text-xs text-blue-700 flex-1">
              Share your live trip location with family and friends for safety
            </Text>
          </View>

          {/* Active Share */}
          {shareData ? (
            <View className="mb-5">
              <Text className="text-base font-semibold text-gray-900 mb-4">
                Active Share Link
              </Text>
              <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <View className="flex-row items-center mb-4">
                  <Ionicons name="link" size={20} color="#2196F3" />
                  <View className="ml-2 flex-1">
                    <Text
                      className="text-xs text-blue-600 mb-1"
                      numberOfLines={1}
                    >
                      {shareData.shareUrl}
                    </Text>
                    <Text className="text-xs text-gray-600">
                      {formatExpirationTime(shareData.expiresAt)}
                    </Text>
                  </View>
                </View>

                <View className="flex-row justify-around">
                  <TouchableOpacity
                    onPress={handleCopyLink}
                    className="flex-row items-center px-3 py-2 rounded-lg bg-white border border-gray-200 min-w-[80px] justify-center"
                  >
                    <Ionicons name="copy-outline" size={20} color="#2196F3" />
                    <Text className="ml-1 text-xs font-medium text-gray-900">
                      Copy
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleShareLink}
                    className="flex-row items-center px-3 py-2 rounded-lg bg-white border border-gray-200 min-w-[80px] justify-center"
                  >
                    <Ionicons name="share-outline" size={20} color="#4CAF50" />
                    <Text className="ml-1 text-xs font-medium text-gray-900">
                      Share
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeactivateLink(shareData.shareToken)}
                    className="flex-row items-center px-3 py-2 rounded-lg bg-white border border-gray-200 min-w-[80px] justify-center"
                  >
                    <Ionicons name="trash-outline" size={20} color="#F44336" />
                    <Text className="ml-1 text-xs font-medium text-gray-900">
                      Stop
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {activeShares.length > 0 && (
                <View className="mt-2 p-2 bg-white rounded-lg items-center">
                  <Text className="text-xs text-gray-600">
                    Views: {activeShares[0].viewCount}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View className="mb-5">
              <Text className="text-base font-semibold text-gray-900 mb-4">
                Generate Share Link
              </Text>

              {/* Expiration Options */}
              <View className="flex-row justify-between mb-5">
                {[6, 12, 24, 48].map((hours) => (
                  <TouchableOpacity
                    key={hours}
                    onPress={() => setExpirationHours(hours)}
                    className={`flex-1 p-3 rounded-lg mx-1 items-center border-2 ${
                      expirationHours === hours
                        ? "bg-blue-50 border-blue-500"
                        : "bg-gray-50 border-gray-50"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        expirationHours === hours
                          ? "text-blue-600 font-semibold"
                          : "text-gray-600"
                      }`}
                    >
                      {hours}h
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleGenerateLink}
                className="flex-row items-center justify-center bg-blue-600 p-4 rounded-xl"
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="link" size={20} color="#fff" />
                    <Text className="text-white text-base font-semibold ml-2">
                      Generate Share Link
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Security Notice */}
          <View className="flex-row items-center justify-center pt-4 border-t border-gray-200">
            <Ionicons name="shield-checkmark" size={16} color="#666" />
            <Text className="ml-2 text-xs text-gray-600">
              Links expire automatically and can be deactivated anytime
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
