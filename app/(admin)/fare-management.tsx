import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/src/constants/theme";
import { fareService, FareSettings } from "@/src/services/fare.service";
import {
  showErrorAlert,
  showSuccessAlert,
  showWarningConfirm,
  showDestructiveConfirm,
} from "@/src/utils/alerts";

export default function FareManagementScreen() {
  const [currentSettings, setCurrentSettings] = useState<FareSettings | null>(null);
  const [allSettings, setAllSettings] = useState<FareSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSettings, setSelectedSettings] = useState<FareSettings | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    baseFare: "",
    ratePerKm: "",
    minimumFare: "",
    maximumFare: "",
    timeBasedRate: "",
  });

  // Sample calculation
  const [sampleDistance, setSampleDistance] = useState("5");
  const [calculatedFare, setCalculatedFare] = useState<number | null>(null);

  const loadFareData = async () => {
    try {
      setIsLoading(true);

      // Load current settings
      const currentResponse = await fareService.getCurrentFareSettings();
      if (currentResponse.success) {
        setCurrentSettings(currentResponse.data || null);
      }

      // Load all settings (admin only)
      const allResponse = await fareService.getAllFareSettings();
      if (allResponse.success) {
        setAllSettings(allResponse.data || []);
      }
    } catch (error) {
      console.error("Error loading fare data:", error);
      showErrorAlert(
        "Loading Error",
        "Failed to load fare data. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFareData();
  };

  const calculateSampleFare = () => {
    if (currentSettings && sampleDistance) {
      const distance = parseFloat(sampleDistance);
      if (!isNaN(distance) && distance >= 0) {
        const fare = fareService.calculateFareLocal(
          distance,
          currentSettings.baseFare,
          currentSettings.ratePerKm
        );
        setCalculatedFare(Math.round(fare * 100) / 100);
      } else {
        setCalculatedFare(null);
      }
    }
  };

  const handleCreateSettings = async () => {
    const baseFare = parseFloat(formData.baseFare);
    const ratePerKm = parseFloat(formData.ratePerKm);
    const minimumFare = formData.minimumFare ? parseFloat(formData.minimumFare) : undefined;
    const maximumFare = formData.maximumFare ? parseFloat(formData.maximumFare) : undefined;
    const timeBasedRate = formData.timeBasedRate ? parseFloat(formData.timeBasedRate) : undefined;

    if (isNaN(baseFare) || baseFare <= 0) {
      showErrorAlert("Invalid Base Fare", "Please enter a valid base fare amount");
      return;
    }

    if (isNaN(ratePerKm) || ratePerKm <= 0) {
      showErrorAlert("Invalid Rate", "Please enter a valid rate per kilometer");
      return;
    }

    if (minimumFare !== undefined && (isNaN(minimumFare) || minimumFare < 0)) {
      showErrorAlert("Invalid Minimum Fare", "Please enter a valid minimum fare amount");
      return;
    }

    if (maximumFare !== undefined && (isNaN(maximumFare) || maximumFare <= 0)) {
      showErrorAlert("Invalid Maximum Fare", "Please enter a valid maximum fare amount");
      return;
    }

    if (minimumFare !== undefined && maximumFare !== undefined && minimumFare >= maximumFare) {
      showErrorAlert("Invalid Fare Range", "Maximum fare must be greater than minimum fare");
      return;
    }

    if (timeBasedRate !== undefined && (isNaN(timeBasedRate) || timeBasedRate < 0)) {
      showErrorAlert("Invalid Time Rate", "Please enter a valid time-based rate");
      return;
    }

    try {
      const response = await fareService.createFareSettings({
        baseFare,
        ratePerKm,
        minimumFare,
        maximumFare,
        timeBasedRate,
      });

      if (response.success) {
        showSuccessAlert(
          "Fare Settings Created",
          "New fare settings have been created successfully and are now active"
        );
        setShowCreateModal(false);
        setFormData({
          baseFare: "",
          ratePerKm: "",
          minimumFare: "",
          maximumFare: "",
          timeBasedRate: "",
        });
        loadFareData();
      } else {
        showErrorAlert("Creation Failed", response.message || "Failed to create fare settings");
      }
    } catch (error) {
      console.error("Error creating fare settings:", error);
      showErrorAlert(
        "Network Error",
        "Failed to create fare settings. Please check your connection and try again."
      );
    }
  };

  const handleUpdateSettings = async () => {
    if (!selectedSettings) return;

    const baseFare = parseFloat(formData.baseFare);
    const ratePerKm = parseFloat(formData.ratePerKm);
    const minimumFare = formData.minimumFare ? parseFloat(formData.minimumFare) : undefined;
    const maximumFare = formData.maximumFare ? parseFloat(formData.maximumFare) : undefined;
    const timeBasedRate = formData.timeBasedRate ? parseFloat(formData.timeBasedRate) : undefined;

    if (isNaN(baseFare) || baseFare <= 0) {
      showErrorAlert("Invalid Base Fare", "Please enter a valid base fare amount");
      return;
    }

    if (isNaN(ratePerKm) || ratePerKm <= 0) {
      showErrorAlert("Invalid Rate", "Please enter a valid rate per kilometer");
      return;
    }

    if (minimumFare !== undefined && (isNaN(minimumFare) || minimumFare < 0)) {
      showErrorAlert("Invalid Minimum Fare", "Please enter a valid minimum fare amount");
      return;
    }

    if (maximumFare !== undefined && (isNaN(maximumFare) || maximumFare <= 0)) {
      showErrorAlert("Invalid Maximum Fare", "Please enter a valid maximum fare amount");
      return;
    }

    if (minimumFare !== undefined && maximumFare !== undefined && minimumFare >= maximumFare) {
      showErrorAlert("Invalid Fare Range", "Maximum fare must be greater than minimum fare");
      return;
    }

    if (timeBasedRate !== undefined && (isNaN(timeBasedRate) || timeBasedRate < 0)) {
      showErrorAlert("Invalid Time Rate", "Please enter a valid time-based rate");
      return;
    }

    try {
      const response = await fareService.updateFareSettings(selectedSettings.id, {
        baseFare,
        ratePerKm,
        minimumFare,
        maximumFare,
        timeBasedRate,
      });

      if (response.success) {
        showSuccessAlert(
          "Fare Settings Updated",
          "Fare settings have been updated successfully and changes are now active"
        );
        setShowEditModal(false);
        setSelectedSettings(null);
        setFormData({
          baseFare: "",
          ratePerKm: "",
          minimumFare: "",
          maximumFare: "",
          timeBasedRate: "",
        });
        loadFareData();
      } else {
        showErrorAlert("Update Failed", response.message || "Failed to update fare settings");
      }
    } catch (error) {
      console.error("Error updating fare settings:", error);
      showErrorAlert(
        "Network Error",
        "Failed to update fare settings. Please check your connection and try again."
      );
    }
  };

  const confirmActivateSettings = (settings: FareSettings) => {
    showWarningConfirm(
      "Activate Fare Settings",
      `Are you sure you want to activate these fare settings? This will deactivate any currently active settings and apply the new rates:\n\nBase Fare: ₱${settings.baseFare}\nRate per KM: ₱${settings.ratePerKm}`,
      () => handleActivateSettings(settings),
      undefined,
      "Activate"
    );
  };

  const handleActivateSettings = async (settings: FareSettings) => {
    try {
      const response = await fareService.updateFareSettings(settings.id, {
        isActive: true,
      });

      if (response.success) {
        showSuccessAlert(
          "Fare Settings Activated",
          "The new fare settings are now active and will be used for all new rides"
        );
        loadFareData();
      } else {
        showErrorAlert("Activation Failed", response.message || "Failed to activate fare settings");
      }
    } catch (error) {
      console.error("Error activating fare settings:", error);
      showErrorAlert(
        "Network Error",
        "Failed to activate fare settings. Please check your connection."
      );
    }
  };

  const confirmDeleteSettings = (settings: FareSettings) => {
    if (settings.isActive) {
      showErrorAlert(
        "Cannot Delete Active Settings",
        "You cannot delete the currently active fare settings. Please activate different settings first."
      );
      return;
    }

    showDestructiveConfirm(
      "Delete Fare Settings",
      `Are you sure you want to permanently delete these fare settings?\n\nBase Fare: ₱${settings.baseFare}\nRate per KM: ₱${settings.ratePerKm}\n\nThis action cannot be undone.`,
      () => handleDeleteSettings(settings),
      undefined,
      "Delete Permanently"
    );
  };

  const handleDeleteSettings = async (settings: FareSettings) => {
    try {
      const response = await fareService.deleteFareSettings(settings.id);

      if (response.success) {
        showSuccessAlert(
          "Fare Settings Deleted",
          "The fare settings have been permanently deleted"
        );
        loadFareData();
      } else {
        showErrorAlert("Deletion Failed", response.message || "Failed to delete fare settings");
      }
    } catch (error) {
      console.error("Error deleting fare settings:", error);
      showErrorAlert(
        "Network Error",
        "Failed to delete fare settings. Please check your connection."
      );
    }
  };

  const openEditModal = (settings: FareSettings) => {
    setSelectedSettings(settings);
    setFormData({
      baseFare: settings.baseFare.toString(),
      ratePerKm: settings.ratePerKm.toString(),
      minimumFare: settings.minimumFare?.toString() || "",
      maximumFare: settings.maximumFare?.toString() || "",
      timeBasedRate: settings.timeBasedRate?.toString() || "",
    });
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    setFormData({
      baseFare: "",
      ratePerKm: "",
      minimumFare: "",
      maximumFare: "",
      timeBasedRate: "",
    });
    setShowCreateModal(true);
  };

  const confirmCreateSettings = () => {
    showWarningConfirm(
      "Create New Fare Settings",
      "Are you sure you want to create these new fare settings? You can activate them later to make them the current rates for all rides.",
      handleCreateSettings,
      undefined,
      "Create Settings"
    );
  };

  const confirmUpdateSettings = () => {
    showWarningConfirm(
      "Update Fare Settings",
      "Are you sure you want to update these fare settings? If these settings are currently active, the changes will affect all new rides immediately.",
      handleUpdateSettings,
      undefined,
      "Update Settings"
    );
  };

  useEffect(() => {
    loadFareData();
  }, []);

  useEffect(() => {
    calculateSampleFare();
  }, [currentSettings, sampleDistance]);

  const FareSettingsCard = ({
    settings,
    isCurrent = false,
  }: {
    settings: FareSettings;
    isCurrent?: boolean;
  }) => (
    <View
      className={`bg-white rounded-xl p-4 mb-3 shadow-sm border ${
        isCurrent ? "border-green-300 bg-green-50" : "border-gray-100"
      }`}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <Text className="text-lg font-semibold text-gray-900 mr-2">
              ₱{settings.baseFare} + ₱{settings.ratePerKm}/km
            </Text>
            {settings.isActive && (
              <View className="px-2 py-1 bg-green-100 rounded-full">
                <Text className="text-green-700 text-xs font-medium">Active</Text>
              </View>
            )}
          </View>
          <Text className="text-gray-600 text-sm">
            Created: {new Date(settings.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={() => openEditModal(settings)}
            className="w-8 h-8 bg-blue-50 rounded-lg items-center justify-center"
          >
            <Ionicons name="pencil" size={16} color="#3B82F6" />
          </TouchableOpacity>
          {!settings.isActive && (
            <TouchableOpacity
              onPress={() => confirmActivateSettings(settings)}
              className="w-8 h-8 bg-green-50 rounded-lg items-center justify-center"
            >
              <Ionicons name="checkmark" size={16} color="#10B981" />
            </TouchableOpacity>
          )}
          {!settings.isActive && (
            <TouchableOpacity
              onPress={() => confirmDeleteSettings(settings)}
              className="w-8 h-8 bg-red-50 rounded-lg items-center justify-center"
            >
              <Ionicons name="trash" size={16} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const FormModal = ({
    visible,
    onClose,
    onSubmit,
    title,
  }: {
    visible: boolean;
    onClose: () => void;
    onSubmit: () => void;
    title: string;
  }) => (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          <View className="space-y-6">
            <View>
              <Text className="text-gray-700 font-medium mb-2">Base Fare (₱)</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white"
                placeholder="Enter base fare"
                value={formData.baseFare}
                onChangeText={(value) => setFormData((prev) => ({ ...prev, baseFare: value }))}
                keyboardType="numeric"
              />
              <Text className="text-gray-500 text-sm mt-1">
                The minimum fare charged for any ride
              </Text>
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Rate per Kilometer (₱)</Text>
              <TextInput
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white"
                placeholder="Enter rate per km"
                value={formData.ratePerKm}
                onChangeText={(value) => setFormData((prev) => ({ ...prev, ratePerKm: value }))}
                keyboardType="numeric"
              />
              <Text className="text-gray-500 text-sm mt-1">
                Additional charge per kilometer traveled
              </Text>
            </View>

            {/* Preview */}
            {formData.baseFare && formData.ratePerKm && (
              <View className="bg-gray-50 rounded-xl p-4">
                <Text className="text-gray-700 font-medium mb-2">Preview</Text>
                <Text className="text-lg text-gray-900">
                  Formula: ₱{formData.baseFare} + (distance × ₱{formData.ratePerKm})
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  Example: 5km ride = ₱{formData.baseFare} + (5 × ₱{formData.ratePerKm}) = ₱
                  {(parseFloat(formData.baseFare) + 5 * parseFloat(formData.ratePerKm)).toFixed(2)}
                </Text>
              </View>
            )}

            <TouchableOpacity
              className="w-full py-4 bg-blue-600 rounded-lg items-center"
              onPress={onSubmit}
            >
              <Text className="text-white font-semibold text-lg">{title}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-900">Fare Management</Text>
          <TouchableOpacity
            onPress={openCreateModal}
            className="w-10 h-10 bg-blue-600 rounded-lg items-center justify-center"
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Current Settings */}
        {currentSettings && (
          <View className="px-6 py-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Current Active Settings
            </Text>
            <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-2xl font-bold text-green-800">
                  ₱{currentSettings.baseFare} + ₱{currentSettings.ratePerKm}/km
                </Text>
                <View className="px-3 py-1 bg-green-200 rounded-full">
                  <Text className="text-green-800 font-medium">Active</Text>
                </View>
              </View>
              <Text className="text-green-700 mb-3">
                Formula: Fare = ₱{currentSettings.baseFare} + (distance × ₱
                {currentSettings.ratePerKm})
              </Text>

              {/* Sample Calculator */}
              <View className="bg-white rounded-lg p-3 border border-green-200">
                <Text className="text-gray-700 font-medium mb-2">Fare Calculator</Text>
                <View className="flex-row items-center space-x-3">
                  <TextInput
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Distance (km)"
                    value={sampleDistance}
                    onChangeText={setSampleDistance}
                    keyboardType="numeric"
                  />
                  <Text className="text-gray-700">=</Text>
                  <View className="px-3 py-2 bg-gray-100 rounded-lg">
                    <Text className="font-semibold text-gray-900">
                      ₱{calculatedFare?.toFixed(2) || "0.00"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* All Settings History */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Settings History</Text>

          {isLoading ? (
            <View className="items-center py-8">
              <Text className="text-gray-500">Loading fare settings...</Text>
            </View>
          ) : allSettings.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="calculator-outline" size={64} color="#9CA3AF" />
              <Text className="text-gray-500 text-lg mt-4">No fare settings found</Text>
              <Text className="text-gray-400 text-center mt-2">
                Create your first fare settings to get started
              </Text>
            </View>
          ) : (
            allSettings.map((settings) => (
              <FareSettingsCard
                key={settings.id}
                settings={settings}
                isCurrent={settings.isActive}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Create Modal */}
      <FormModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={confirmCreateSettings}
        title="Create Fare Settings"
      />

      {/* Edit Modal */}
      <FormModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedSettings(null);
        }}
        onSubmit={confirmUpdateSettings}
        title="Update Fare Settings"
      />
    </SafeAreaView>
  );
}
