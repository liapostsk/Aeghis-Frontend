import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";

import { searchNearbyPlaces, searchPlacesByText } from "../../api/safeLocations/googlePlacesApi";
import { SafeLocation } from "../../api/types";
import { useUserStore } from "../../lib/storage/useUserStorage";

const { width, height } = Dimensions.get("window");

export default function SafeLocationStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<SafeLocation[]>([]);
  const [searchResults, setSearchResults] = useState<SafeLocation[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const { user, setUser } = useUserStore();

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

  // Buscar lugares cercanos cuando se obtiene la ubicación
  useEffect(() => {
    const fetchNearby = async () => {
      if (!currentLocation) return;

      try {
        const locations = await searchNearbyPlaces({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          radius: 1500,
        });
        setSearchResults(locations);
      } catch (error) {
        console.error("Error buscando lugares cercanos:", error);
      }
    };

    fetchNearby();
  }, [currentLocation]);

  useEffect(() => {
    console.log("🧪 searchResults:", searchResults);
  }, [searchResults]);

  // Buscar por texto
  useEffect(() => {
    if (searchQuery.length > 2 && currentLocation) {
      const timeout = setTimeout(async () => {
        try {
          const results = await searchPlacesByText({
            query: searchQuery,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          });
          setSearchResults(results);
        } catch (error) {
          console.error("Error en búsqueda por texto:", error);
        }
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [searchQuery, currentLocation]);

  const handleLocationSelect = (location: SafeLocation): void => {
    const isAlreadySelected = selectedLocations.some(
      (loc) => String(loc.id) === String(location.id)
    );

    if (isAlreadySelected) {
      setSelectedLocations((prev) =>
        prev.filter((loc) => String(loc.id) !== String(location.id))
      );
    } else {
      setSelectedLocations((prev) => [...prev, location]);
    }
  };


  const handleContinue = () => {
    if (selectedLocations.length === 0) {
      Alert.alert("Atención", "Selecciona al menos una SafeLocation para continuar.");
      return;
    }

    setUser({ ...user, safeLocations: selectedLocations });

    console.log("SafeLocations seleccionadas:", selectedLocations);
    onNext();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Safe Location</Text>
        <Text style={styles.subtitle}>
          Selecciona tus ubicaciones seguras para indicar que estás a salvo.
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar ubicación..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <Text style={styles.sectionTitle}>
        {searchQuery.length > 2 ? "🔍 Resultados de búsqueda" : "📍 Lugares cercanos"}
      </Text>

      <ScrollView style={styles.listContainer}>
        {searchResults.map((location, index) => (
          <LocationItem
            key={location.id || index}
            location={location}
            isSelected={!!selectedLocations.find((loc) => loc.id === location.id)}
            onPress={() => handleLocationSelect(location)}
          />
        ))}

        {selectedLocations.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>✅ SafeLocations seleccionadas ({selectedLocations.length})</Text>
            {selectedLocations.map((location) => (
              <LocationItem
                key={location.id}
                location={location}
                isSelected={true}
                onPress={() => handleLocationSelect(location)}
              />
            ))}
          </>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Atrás</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>
            Continuar {selectedLocations.length > 0 && `(${selectedLocations.length})`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

type LocationItemProps = {
  location: SafeLocation;
  isSelected: boolean;
  onPress: () => void;
};

function LocationItem({ location, isSelected, onPress }: LocationItemProps) {
  return (
    <TouchableOpacity
      style={[styles.locationItem, isSelected && styles.selectedLocationItem]}
      onPress={onPress}
    >
      <View style={styles.locationInfo}>
        <Text style={[styles.locationName, isSelected && styles.selectedText]}>
          {location.name}
        </Text>
        <Text style={[styles.locationAddress, isSelected && styles.selectedSubText]}>
          {location.address}
        </Text>
        {location.distance && (
          <Text style={styles.locationDistance}>{location.distance}</Text>
        )}
      </View>
      <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7A33CC',
    padding: 20,
  },
  titleContainer: {
    top: -30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  searchContainer: {
    top: -20,
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapContainer: {
    top: -20,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    height: 50,
    marginBottom: 20,
    justifyContent: 'center',
  },
  mapButtonText: {
    left: 20,
    fontSize: 16,
    color: '#000000',
  },
  listContainer: {
    top: -20,
    flex: 1,
  },
  sectionTitle: {
    top: -20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    marginTop: 10,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedLocationItem: {
    backgroundColor: '#e8f5e8',
    borderWidth: 2,
    borderColor: '#27ae60',
  },
  locationIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  locationDistance: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '500',
  },
  selectedText: {
    color: '#27ae60',
  },
  selectedSubText: {
    color: '#2ecc71',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bdc3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    bottom: -20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#95a5a6',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueButton: {
    flex: 2,
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});