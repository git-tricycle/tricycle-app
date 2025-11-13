import React, { useRef, useImperativeHandle, forwardRef } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface MapViewProps {
  center?: Location;
  markers?: Array<{
    id: string;
    location: Location;
    title?: string;
    color?: string;
    icon?: string;
  }>;
  onLocationSelect?: (location: Location) => void;
  onMarkerPress?: (markerId: string) => void;
  showMyLocation?: boolean;
  height?: number;
  interactive?: boolean;
  className?: string;
}

export interface MapViewRef {
  setCenter: (location: Location) => void;
  addMarker: (marker: { id: string; location: Location; title?: string; color?: string }) => void;
  removeMarker: (markerId: string) => void;
  getCurrentLocation: () => Promise<Location>;
}

const MapView = forwardRef<MapViewRef, MapViewProps>(
  (
    {
      center = { latitude: 13.92077, longitude: 122.09891 }, // Jollibee Gumaca, Quezon default
      markers = [],
      onLocationSelect,
      onMarkerPress,
      showMyLocation = true,
      height = 300,
      interactive = true,
      className = "",
    },
    ref
  ) => {
    const webViewRef = useRef<WebView>(null);

    useImperativeHandle(ref, () => ({
      setCenter: (location: Location) => {
        webViewRef.current?.postMessage(
          JSON.stringify({
            type: "setCenter",
            payload: location,
          })
        );
      },
      addMarker: (marker) => {
        webViewRef.current?.postMessage(
          JSON.stringify({
            type: "addMarker",
            payload: marker,
          })
        );
      },
      removeMarker: (markerId: string) => {
        webViewRef.current?.postMessage(
          JSON.stringify({
            type: "removeMarker",
            payload: { id: markerId },
          })
        );
      },
      getCurrentLocation: async () => {
        return new Promise((resolve) => {
          // This would need to be implemented with proper geolocation
          resolve(center);
        });
      },
    }));

    const handleMessage = (event: any) => {
      try {
        const message = JSON.parse(event.nativeEvent.data);

        switch (message.type) {
          case "locationSelected":
            onLocationSelect?.(message.payload);
            break;
          case "markerPressed":
            onMarkerPress?.(message.payload.markerId);
            break;
        }
      } catch (error) {
        console.error("MapView message error:", error);
      }
    };

    const generateMapHTML = () => {
      return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100%; }
        .leaflet-popup-content-wrapper {
            background: #fff;
            color: #333;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .leaflet-popup-tip {
            background: #fff;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        let map;
        let markers = {};
        let userLocationMarker = null;
        
        // Initialize map
        function initMap() {
            map = L.map('map', {
                zoomControl: true,
                attributionControl: false
            }).setView([${center.latitude}, ${center.longitude}], 15);

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            ${
              interactive
                ? `
            // Add click listener for location selection
            map.on('click', function(e) {
                const location = {
                    latitude: e.latlng.lat,
                    longitude: e.latlng.lng
                };
                
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'locationSelected',
                    payload: location
                }));
            });
            `
                : ""
            }

            ${
              showMyLocation
                ? `
            // Try to get user's location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    const userLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    
                    // Add user location marker
                    userLocationMarker = L.circleMarker([userLocation.latitude, userLocation.longitude], {
                        color: '#2563eb',
                        fillColor: '#3b82f6',
                        fillOpacity: 0.8,
                        radius: 8
                    }).addTo(map);
                    
                    userLocationMarker.bindPopup('Your Location');
                });
            }
            `
                : ""
            }

            // Add initial markers
            const initialMarkers = ${JSON.stringify(markers)};
            initialMarkers.forEach(marker => {
                addMarkerToMap(marker);
            });
        }

        function addMarkerToMap(marker) {
            const leafletMarker = L.marker([marker.location.latitude, marker.location.longitude])
                .addTo(map);
            
            if (marker.title) {
                leafletMarker.bindPopup(marker.title);
            }
            
            leafletMarker.on('click', function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'markerPressed',
                    payload: { markerId: marker.id }
                }));
            });
            
            markers[marker.id] = leafletMarker;
        }

        // Message handler from React Native
        window.addEventListener('message', function(event) {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
                case 'setCenter':
                    map.setView([message.payload.latitude, message.payload.longitude], 15);
                    break;
                case 'addMarker':
                    addMarkerToMap(message.payload);
                    break;
                case 'removeMarker':
                    if (markers[message.payload.id]) {
                        map.removeLayer(markers[message.payload.id]);
                        delete markers[message.payload.id];
                    }
                    break;
            }
        });

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', initMap);
    </script>
</body>
</html>
    `;
    };

    return (
      <View className={`rounded-xl overflow-hidden ${className}`} style={{ height }}>
        <WebView
          ref={webViewRef}
          source={{ html: generateMapHTML() }}
          onMessage={handleMessage}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          scrollEnabled={false}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }
);

MapView.displayName = "MapView";

export default MapView;
