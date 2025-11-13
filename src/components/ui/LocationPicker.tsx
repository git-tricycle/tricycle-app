import { Ionicons } from "@expo/vector-icons";
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import MapView, { Location, MapViewRef } from "./MapView";

interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
  location: Location;
}

interface LocationPickerProps {
  title: string;
  placeholder: string;
  onLocationSelect: (location: Location & { address: string }) => void;
  onCancel: () => void;
  initialLocation?: Location;
  className?: string;
}

export default function LocationPicker({
  title,
  placeholder,
  onLocationSelect,
  onCancel,
  initialLocation,
  className = "",
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    initialLocation || null
  );
  const [selectedAddress, setSelectedAddress] = useState("");
  const mapRef = useRef<MapViewRef>(null);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchLocations(searchQuery.trim());
      } else {
        setSuggestions([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Define Gumaca area boundaries (approximate)
  const GUMACA_BOUNDS = {
    north: 13.95,
    south: 13.8,
    east: 122.65,
    west: 122.05,
  };

  // Check if a location is within Gumaca area
  const isLocationInGumaca = (latitude: number, longitude: number): boolean => {
    return (
      latitude >= GUMACA_BOUNDS.south &&
      latitude <= GUMACA_BOUNDS.north &&
      longitude >= GUMACA_BOUNDS.west &&
      longitude <= GUMACA_BOUNDS.east
    );
  };

  // Location search using Nominatim (OpenStreetMap) API - no key required
  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      // Use Nominatim (OpenStreetMap) for geocoding - free, no API key needed
      // IMPORTANT: Must include User-Agent header (required by Nominatim)
      const headers = {
        "User-Agent": "TricycleApp/1.0 (Gumaca Ride Booking)",
      };

      // Searching specifically in Gumaca, Quezon area
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query)}, Gumaca, Quezon, Philippines&` +
          `format=json&` +
          `limit=8&` +
          `viewbox=122.05,13.95,122.65,13.8&` + // Gumaca bounding box
          `bounded=1`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const suggestions: LocationSuggestion[] = data.map((place, index) => ({
          id: `${place.place_id || index}`,
          name: place.name || place.display_name?.split(",")[0] || "Unknown Place",
          address: place.display_name || "No address available",
          location: {
            latitude: parseFloat(place.lat),
            longitude: parseFloat(place.lon),
          },
        }));

        setSuggestions(suggestions.slice(0, 8));
      } else {
        // If no results from API, show message
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Nominatim search error:", error);

      // Fallback: try alternative search with just the query
      try {
        const headers = {
          "User-Agent": "TricycleApp/1.0 (Gumaca Ride Booking)",
        };

        const fallbackResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(query)}&` +
            `format=json&` +
            `limit=8`,
          { headers }
        );

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();

          if (Array.isArray(fallbackData) && fallbackData.length > 0) {
            const suggestions: LocationSuggestion[] = fallbackData.map((place, index) => ({
              id: `${place.place_id || index}`,
              name: place.name || place.display_name?.split(",")[0] || "Unknown Place",
              address: place.display_name || "No address available",
              location: {
                latitude: parseFloat(place.lat),
                longitude: parseFloat(place.lon),
              },
            }));

            setSuggestions(suggestions.slice(0, 8));
          } else {
            setSuggestions([]);
          }
        }
      } catch (fallbackError) {
        console.error("Fallback search error:", fallbackError);
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapLocationSelect = (location: Location) => {
    // Validate if location is within Gumaca area
    if (!isLocationInGumaca(location.latitude, location.longitude)) {
      Alert.alert(
        "Location Not Available",
        "Sorry, we only provide services within Gumaca area. Please select a location within Gumaca, Quezon Province.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    setSelectedLocation(location);
    // In a real app, you'd reverse geocode to get the address
    setSelectedAddress(
      `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)} (Gumaca Area)`
    );
    setSearchQuery(`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
    setSuggestions([]);
  };

  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    setSelectedLocation(suggestion.location);
    setSelectedAddress(suggestion.address);
    setSearchQuery(suggestion.name);
    setSuggestions([]);
    mapRef.current?.setCenter(suggestion.location);
  };

  const handleConfirm = () => {
    if (!selectedLocation) {
      Alert.alert("Error", "Please select a location");
      return;
    }

    // Final validation before confirming
    if (!isLocationInGumaca(selectedLocation.latitude, selectedLocation.longitude)) {
      Alert.alert(
        "Location Not Available",
        "Sorry, we only provide services within Gumaca area. Please select a location within Gumaca, Quezon Province.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    onLocationSelect({
      ...selectedLocation,
      address: selectedAddress || "Selected Location",
    });
  };

  const getCurrentLocation = async () => {
    if (isGettingLocation) return;

    setIsGettingLocation(true);

    try {
      // Use Expo Location for real location
      const Location = await import("expo-location");

      // Request permission to access location
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setIsGettingLocation(false);
        Alert.alert(
          "Location Permission Required",
          "Please enable location access to use this feature.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Settings",
              onPress: () => {
                // In a real app, you might want to open device settings
                console.log("Open app settings");
              },
            },
          ]
        );
        return;
      }

      // Get current position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 1,
      });

      const currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setSelectedLocation(currentLocation);
      setSelectedAddress("Current Location");
      setSearchQuery("Current Location");
      mapRef.current?.setCenter(currentLocation);
    } catch (error) {
      console.error("Location error:", error);

      // Fallback to Jollibee Gumaca if location fails
      const fallbackLocation = {
        latitude: 13.92077,
        longitude: 122.09891,
      };

      setSelectedLocation(fallbackLocation);
      setSelectedAddress("Jollibee Gumaca, Quezon (Fallback)");
      setSearchQuery("Jollibee Gumaca, Quezon (Fallback)");
      mapRef.current?.setCenter(fallbackLocation);

      Alert.alert(
        "Location Error",
        "Could not get your current location. Using default location instead."
      );
    } finally {
      setIsGettingLocation(false);
    }
  };
  return (
    <View className={`flex-1 bg-white ${className}`}>
      {/* Header */}
      <View className="bg-black px-6 py-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={onCancel} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold flex-1">{title}</Text>
      </View>

      {/* Search Bar */}
      <View className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <View className="flex-row items-center bg-white rounded-xl border border-gray-300">
          <View className="pl-4">
            <Ionicons name="search" size={20} color="#6b7280" />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={placeholder}
            className="flex-1 px-3 py-3 text-black"
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity
            onPress={getCurrentLocation}
            className="pr-4"
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Ionicons name="locate" size={20} color="#000000" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Map */}
      <View className="flex-1">
        <MapView
          ref={mapRef}
          center={initialLocation}
          onLocationSelect={handleMapLocationSelect}
          markers={
            selectedLocation
              ? [
                  {
                    id: "selected",
                    location: selectedLocation,
                    title: "Selected Location",
                    color: "#000000",
                  },
                ]
              : []
          }
          height={300}
          className="flex-1"
        />

        {/* Map Instructions */}
        <View className="absolute top-4 left-4 right-4">
          <View className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2">
            <Text className="text-black text-sm text-center">
              Tap on the map or search above to select a location within Gumaca area
            </Text>
          </View>
        </View>
      </View>

      {/* Suggestions List */}
      {(suggestions.length > 0 ||
        isLoading ||
        (searchQuery.length >= 2 && !isLoading && suggestions.length === 0)) && (
        <View className="bg-white border-t border-gray-200" style={{ maxHeight: 200 }}>
          {isLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator color="#000000" />
              <Text className="text-gray-500 mt-2">Searching...</Text>
            </View>
          ) : suggestions.length > 0 ? (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSuggestionSelect(item)}
                  className="px-6 py-4 border-b border-gray-100"
                >
                  <View className="flex-row items-center">
                    <Ionicons name="location" size={20} color="#6b7280" />
                    <View className="ml-3 flex-1">
                      <Text className="text-black font-medium">{item.name}</Text>
                      <Text className="text-gray-500 text-sm">{item.address}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View className="py-8 px-6 items-center">
              <Ionicons name="search" size={24} color="#9CA3AF" />
              <Text className="text-gray-500 text-center mt-2 font-medium">No locations found</Text>
              <Text className="text-gray-400 text-center text-sm mt-1">
                Try searching for places within Gumaca, Quezon or use the map to select a location
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Confirm Button */}
      <View className="p-6 bg-white border-t border-gray-200">
        <TouchableOpacity
          onPress={handleConfirm}
          className={`rounded-xl py-4 ${selectedLocation ? "bg-black" : "bg-gray-300"}`}
          disabled={!selectedLocation}
        >
          <Text
            className={`text-center font-semibold ${
              selectedLocation ? "text-white" : "text-gray-500"
            }`}
          >
            Confirm Location
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
