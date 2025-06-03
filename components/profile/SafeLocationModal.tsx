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
import { getPlaceDetails, searchPlacesByText } from "../../api/safeLocations/googlePlacesApi";
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


  // Obtener ubicación real del usuario
    useEffect(() => {
      const fetchLocation = async () => {
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
      };
  
      fetchLocation();
    }, []);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
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
        const fetched = await searchPlacesByText({ query });
        setResults(fetched);
      } catch (e) {
        console.error("Error al buscar lugares:", e);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [query]);

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
            <Text style={styles.title}>Buscar ubicación segura</Text>
            <TextInput
              style={styles.input}
              placeholder="Escribe un lugar..."
              value={query}
              onChangeText={setQuery}
              placeholderTextColor="#999"
            />

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
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.address}>{item.address}</Text>
                  </TouchableOpacity>
                )}
              />
            )}

            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
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
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
  },
  address: {
    color: "#666",
  },
  cancelButton: {
    marginTop: 20,
    alignItems: "center",
  },
  cancelText: {
    color: "#888",
    fontSize: 16,
  },
});
