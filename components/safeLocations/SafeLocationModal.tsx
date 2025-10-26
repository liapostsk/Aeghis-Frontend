import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { getPlaceDetails, searchPlacesByText, searchNearbyPlaces } from "@/api/locations/safeLocations/googlePlacesApi";
import { searchLocationsByText } from "@/api/locations/safeLocations/googleGeocodingApi";
import { SafeLocation } from "@/api/locations/locationType";
import { useAuth } from "@clerk/clerk-expo";
import { useTokenStore } from "@/lib/auth/tokenStore";
import * as Location from "expo-location";
import MapLocationPicker from "../map/MapLocationPicker";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: SafeLocation) => void;
  title?: string; // Título opcional, por defecto será "Buscar ubicación segura"
}

export default function SafeLocationModal({ visible, onClose, onSelectLocation, title = "Buscar ubicación segura" }: Props) {
  // Estados del componente
  const [query, setQuery] = useState(""); // Busqueda de texto
  const [results, setResults] = useState<SafeLocation[]>([]); // Resultados de búsqueda
  const [loading, setLoading] = useState(false); // Estado de carga
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null); // Ubicación actual del usuario
  const [mapVisible, setMapVisible] = useState(false); // Estado del mapa

  // Hooks externos
  const { getToken } = useAuth(); // Hook para obtener el token de autenticación
  const setToken = useTokenStore((state) => state.setToken); // Hook para guardar el token en el store

  // Función para ordenar ubicaciones por distancia
  const sortLocationsByDistance = (locations: SafeLocation[]): SafeLocation[] => {
    return locations.sort((a, b) => {
      // Extraer números de distancia para comparar
      const getDistanceValue = (distanceStr?: string): number => {
        if (!distanceStr) return Infinity;
        const match = distanceStr.match(/(\d+(?:\.\d+)?)/);
        if (!match) return Infinity;
        const value = parseFloat(match[1]);
        return distanceStr.includes('km') ? value * 1000 : value;
      };
      
      return getDistanceValue(a.distance) - getDistanceValue(b.distance);
    });
  };

  useEffect(() => {
    if (!visible) {
      setMapVisible(false);
    }
  }, [visible]);

  // Obtener ubicación real del usuario y cargar lugares cercanos
  useEffect(() => {
    const fetchLocationAndNearbyPlaces = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "No se pudo acceder a la ubicación.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setCurrentLocation(coords);

      // Cargar lugares cercanos recomendados por defecto
      if (visible) {
        setLoading(true);
        try {
          const token = await getToken();
          if (token) {
            setToken(token);
            const nearbyLocations = await searchNearbyPlaces({
              latitude: coords.latitude,
              longitude: coords.longitude,
              radius: 1500, // 1.5km de radio para lugares más cercanos
              types: ['hospital', 'police', 'pharmacy', 'gas_station', 'subway_station', 'bus_station', 'gym', 'university'], // Tipos de lugares seguros prioritarios
            });
            const sortedLocations = sortLocationsByDistance(nearbyLocations);
            setResults(sortedLocations);
          }
        } catch (error) {
          console.error("Error cargando lugares cercanos:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (visible) {
      fetchLocationAndNearbyPlaces();
    }
  }, [visible]); // Se ejecuta cuando visible cambia

  useEffect(() => {
    if (query.length < 3) {
      // Si no hay búsqueda, mantener los lugares cercanos
      if (query.length === 0 && currentLocation && visible) {
        // Recargar lugares cercanos solo si el campo está completamente vacío
        const loadNearbyPlaces = async () => {
          setLoading(true);
          try {
            const token = await getToken();
            if (token) {
              setToken(token);
              const nearbyLocations = await searchNearbyPlaces({
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                radius: 1500, // 1.5km de radio para lugares más cercanos
                types: ['hospital', 'police', 'pharmacy', 'gas_station', 'subway_station', 'bus_station'], // Tipos de lugares seguros prioritarios
              });
              const sortedLocations = sortLocationsByDistance(nearbyLocations);
              setResults(sortedLocations);
            }
          } catch (error) {
            console.error("Error cargando lugares cercanos:", error);
          } finally {
            setLoading(false);
          }
        };
        loadNearbyPlaces();
      }
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const token = await getToken();
        console.log("Token:", token);
        if (!token) {
          return Alert.alert("Error", "Failed to get token.");
        }
        setToken(token);
        // Primero intentamos con Google Places
        const placesResult = await searchPlacesByText({ 
          query,
          latitude: currentLocation?.latitude,
          longitude: currentLocation?.longitude,
        });

        if (placesResult.length > 0) {
          console.log("Resultados de Google Places:", placesResult);
          const sortedPlacesResult = sortLocationsByDistance(placesResult);
          setResults(sortedPlacesResult);
        } else {
          // Si no hay resultados, intentamos con Google Geocoding
          const geocodingResult = await searchLocationsByText(query,
            currentLocation?.latitude,
            currentLocation?.longitude
          );
          console.log("Resultados de Google Geocoding:", geocodingResult);
          if (geocodingResult.length > 0) {
            console.log(`Geocoding encontró ${geocodingResult.length} direcciones`);
            const sortedGeocodingResult = sortLocationsByDistance(geocodingResult);
            setResults(sortedGeocodingResult);
          } else {
            console.log("No se encontraron resultados en ninguna API");
            setResults([]);
          }
        }
      } catch (e) {
        console.error("Error al buscar lugares:", e);
      } finally {
        setLoading(false);
      }
    }, 500); // Se ejecuta después de 500ms

    return () => clearTimeout(timeout);
  }, [query, currentLocation, visible]);

  const handleSelect = async (placeId: string) => {
    try {
      const details = await getPlaceDetails(placeId, currentLocation?.latitude, currentLocation?.longitude);
      if (details) {
        onSelectLocation(details);
        onClose();
      }
    } catch (err) {
      console.error("Error al obtener detalles:", err);
    }
  };

  const handleMapPickerClose = () => {
    setMapVisible(false);
  };

  const handleMapLocationSelect = (location: SafeLocation) => {
    onSelectLocation(location);
    setMapVisible(false);
    onClose();
  };

  return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <Pressable onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#666" />
                </Pressable>
              </View>
              
              <TextInput
                style={styles.input}
                placeholder="Escribe un lugar..."
                value={query}
                onChangeText={setQuery}
                placeholderTextColor="#999"
              />

              {/* Boton de seleccion en mapa */}
              <Pressable
                style={styles.mapButton}
                onPress={() => {
                      console.log("🗺️ Botón de mapa presionado, abriendo modal...");

                  setMapVisible(true);
                }
              }>
                <Ionicons name="map" size={20} color="#7A33CC" />
                  <Text style={styles.mapButtonText}>Seleccionar en mapa</Text>
                  <Ionicons name="chevron-forward" size={16} color="#7A33CC" />
              </Pressable>

              <View style={styles.sectionHeader}>
                <Ionicons 
                  name={query.length > 2 ? "search" : "location"} 
                  size={16} 
                  color="#7A33CC" 
                />
                <Text style={styles.sectionTitle}>
                  {query.length > 2 ? "Resultados de búsqueda" : "Lugares seguros cercanos"}
                </Text>
              </View>

              {loading ? (
                <ActivityIndicator size="large" color="#7A33CC" style={{ marginTop: 20 }} />
              ) : (
                <FlatList
                  data={results}
                  keyExtractor={(item, index) => item.externalId || item.id?.toString() || `safe-location-${index}`}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.item}
                      onPress={() => {
                        if (item.externalId) handleSelect(item.externalId);
                      }}
                      disabled={!item.externalId}
                    >
                      <View style={styles.itemIcon}>
                        <Ionicons
                          name={
                            item.type === 'hospital' ? 'medical' :
                            item.type === 'police' ? 'shield-checkmark' :
                            item.type === 'fire_station' ? 'flame' :
                            item.type === 'pharmacy' ? 'medical' :
                            item.type === 'school' ? 'school' : 'location'
                          }
                          size={20}
                          color="#7A33CC"
                        />
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.address}>{item.address}</Text>
                        {item.distance && (
                          <Text style={styles.distance}>{item.distance}</Text>
                        )}
                      </View>
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    !loading ? (
                      <View style={styles.emptyState}>
                        <Ionicons name="location-outline" size={48} color="#ccc" />
                        <Text style={styles.emptyText}>
                          {query.length > 2 ? "No se encontraron resultados" : "Cargando lugares seguros cercanos..."}
                        </Text>
                      </View>
                    ) : null
                  }
                />
              )}
            </KeyboardAvoidingView>
          </View>
        </View>
        <MapLocationPicker
          visible={mapVisible}
          onClose={handleMapPickerClose}
          onSelectLocation={handleMapLocationSelect}
        />
      </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modal: {
    flex: 0.85,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 8,
  },
  input: {
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  name: {
    fontWeight: "600",
    fontSize: 16,
    color: "#333",
    marginBottom: 2,
  },
  address: {
    color: "#666",
    fontSize: 14,
    marginBottom: 2,
  },
  distance: {
    color: "#7A33CC",
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e6ff',
  },
  mapButtonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#7A33CC',
    fontWeight: '500',
  },
});
