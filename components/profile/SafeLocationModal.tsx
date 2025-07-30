import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { getPlaceDetails, searchPlacesByText, searchNearbyPlaces } from "../../api/safeLocations/googlePlacesApi";
import { SafeLocation } from "../../api/types";
import { useAuth } from "@clerk/clerk-expo";
import { useTokenStore } from "@/lib/auth/tokenStore";
import * as Location from "expo-location";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: SafeLocation) => void;
}

export default function SafeLocationModal({ visible, onClose, onSelectLocation }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SafeLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);


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
              radius: 2000, // 2km de radio
            });
            setResults(nearbyLocations);
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
  }, [visible]);

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
                radius: 2000,
              });
              setResults(nearbyLocations);
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
        setToken(token); // <—— necesario
        const fetched = await searchPlacesByText({ 
          query,
          latitude: currentLocation?.latitude,
          longitude: currentLocation?.longitude,
        });
        setResults(fetched);
      } catch (e) {
        console.error("Error al buscar lugares:", e);
      } finally {
        setLoading(false);
      }
    }, 500);

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

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <View style={styles.header}>
              <Text style={styles.title}>Buscar ubicación segura</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Escribe un lugar..."
              value={query}
              onChangeText={setQuery}
              placeholderTextColor="#999"
            />

            <View style={styles.sectionHeader}>
              <Ionicons 
                name={query.length > 2 ? "search" : "location"} 
                size={16} 
                color="#7A33CC" 
              />
              <Text style={styles.sectionTitle}>
                {query.length > 2 ? "Resultados de búsqueda" : "Lugares cercanos recomendados"}
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#7A33CC" style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item, index) => item.externalId || item.id?.toString() || `safe-location-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
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
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  !loading ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="location-outline" size={48} color="#ccc" />
                      <Text style={styles.emptyText}>
                        {query.length > 2 ? "No se encontraron resultados" : "Cargando lugares cercanos..."}
                      </Text>
                    </View>
                  ) : null
                }
              />
            )}
          </KeyboardAvoidingView>
        </View>
      </View>
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
});
