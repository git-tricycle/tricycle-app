import React, { useRef, useImperativeHandle, forwardRef, useEffect } from "react";
import { View, Platform } from "react-native";
import { WebView } from "react-native-webview";

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface MapPolyline {
  id: string;
  path: Location[];
  color?: string;
  weight?: number;
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
  polylines?: MapPolyline[];
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
      polylines = [],
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

    // Update polylines when they change
    React.useEffect(() => {
      if (webViewRef.current) {
        webViewRef.current?.postMessage(
          JSON.stringify({
            type: "setPolylines",
            payload: polylines,
          })
        );
      }
    }, [polylines]);

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

            const initialPolylines = ${JSON.stringify(polylines)};
            initialPolylines.forEach(polyline => {
                addPolylineToMap(polyline);
            });
        }

        function addMarkerToMap(marker) {
            let markerOptions = {};
            if (marker.icon) {
                markerOptions.icon = L.icon({
                    iconUrl: marker.icon,
                    iconSize: [36, 36],
                    iconAnchor: [18, 32],
                    popupAnchor: [0, -24],
                    className: 'custom-marker-icon'
                });
            }

            const leafletMarker = L.marker([marker.location.latitude, marker.location.longitude], markerOptions)
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

        function addPolylineToMap(polyline) {
            if (!Array.isArray(polyline.path) || polyline.path.length < 2) {
                return;
            }

            const latLngs = polyline.path.map(point => [point.latitude, point.longitude]);
            const leafletPolyline = L.polyline(latLngs, {
                color: polyline.color || '#22c55e',
                weight: polyline.weight || 6,
                opacity: 0.8,
                lineJoin: 'round'
            }).addTo(map);

            markers[polyline.id] = leafletPolyline;
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
                case 'setPolyline':
                    addPolylineToMap(message.payload);
                    break;
                case 'setPolylines':
                    // Remove all existing polylines
                    Object.keys(markers).forEach(key => {
                        if (markers[key] && markers[key]._latlngs) {
                            map.removeLayer(markers[key]);
                            delete markers[key];
                        }
                    });
                    // Add new polylines
                    if (Array.isArray(message.payload)) {
                        message.payload.forEach(polyline => {
                            addPolylineToMap(polyline);
                        });
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

    // Web implementation using Leaflet
    if (Platform.OS === "web") {
      const mapId = `map-${Math.random().toString(36).substr(2, 9)}`;
      const mapRef = useRef<any>(null);

      useEffect(() => {
        let map: any = null;

        const initMap = async () => {
          // Load Leaflet CSS
          if (!document.getElementById("leaflet-css")) {
            const css = document.createElement("link");
            css.id = "leaflet-css";
            css.rel = "stylesheet";
            css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            css.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
            css.crossOrigin = "";
            document.head.appendChild(css);
          }

          // Load Leaflet JS
          if (!(window as any).L) {
            return new Promise<void>((resolve) => {
              const script = document.createElement("script");
              script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
              script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
              script.crossOrigin = "";
              script.onload = () => {
                setTimeout(() => {
                  createMap();
                  resolve();
                }, 100);
              };
              document.head.appendChild(script);
            });
          } else {
            createMap();
          }
        };

        const createMap = () => {
          const mapElement = document.getElementById(mapId);
          if (!mapElement || !(window as any).L) return;

          try {
            map = (window as any).L.map(mapId, {
              zoomControl: true,
              attributionControl: true,
            }).setView([center.latitude, center.longitude], 15);

            // Add tile layer
            (window as any).L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution: "© OpenStreetMap contributors",
              maxZoom: 19,
            }).addTo(map);

            // Add click handler for location selection
            if (interactive && onLocationSelect) {
              map.on("click", (e: any) => {
                const location = {
                  latitude: e.latlng.lat,
                  longitude: e.latlng.lng,
                };
                onLocationSelect(location);
              });
            }

            // Add markers
            markers.forEach((marker) => {
              let leafletMarker;

              if (marker.icon) {
                const icon = (window as any).L.icon({
                  iconUrl: marker.icon,
                  iconSize: [32, 32],
                  iconAnchor: [16, 32],
                  popupAnchor: [0, -32],
                });
                leafletMarker = (window as any).L.marker(
                  [marker.location.latitude, marker.location.longitude],
                  { icon }
                ).addTo(map);
              } else {
                leafletMarker = (window as any).L.marker([
                  marker.location.latitude,
                  marker.location.longitude,
                ]).addTo(map);
              }

              if (marker.title) {
                leafletMarker.bindPopup(marker.title);
              }

              if (onMarkerPress) {
                leafletMarker.on("click", () => {
                  onMarkerPress(marker.id);
                });
              }
            });

            // Add polylines
            polylines.forEach((polyline) => {
              const latlngs = polyline.path.map((point) => [point.latitude, point.longitude]);
              (window as any).L.polyline(latlngs, {
                color: polyline.color || "#3388ff",
                weight: polyline.weight || 3,
                opacity: 0.8,
              }).addTo(map);
            });

            mapRef.current = map;
          } catch (error) {
            console.error("Error creating map:", error);
          }
        };

        initMap();

        return () => {
          if (map) {
            map.remove();
          }
        };
      }, [mapId, center.latitude, center.longitude]);

      // Update markers when they change
      useEffect(() => {
        if (mapRef.current && (window as any).L) {
          // Clear existing markers and add new ones
          // This is a simplified approach - in production you'd want more sophisticated marker management
          mapRef.current.eachLayer((layer: any) => {
            if (layer instanceof (window as any).L.Marker) {
              mapRef.current.removeLayer(layer);
            }
          });

          markers.forEach((marker) => {
            let leafletMarker;

            if (marker.icon) {
              const icon = (window as any).L.icon({
                iconUrl: marker.icon,
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32],
              });
              leafletMarker = (window as any).L.marker(
                [marker.location.latitude, marker.location.longitude],
                { icon }
              ).addTo(mapRef.current);
            } else {
              leafletMarker = (window as any).L.marker([
                marker.location.latitude,
                marker.location.longitude,
              ]).addTo(mapRef.current);
            }

            if (marker.title) {
              leafletMarker.bindPopup(marker.title);
            }

            if (onMarkerPress) {
              leafletMarker.on("click", () => {
                onMarkerPress(marker.id);
              });
            }
          });
        }
      }, [markers]);

      return (
        <View className={`rounded-xl overflow-hidden ${className}`} style={{ height }}>
          <div
            id={mapId}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 12,
            }}
          />
        </View>
      );
    }

    // Native implementation using WebView
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
