import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import SafeLocationModal from '@/components/safeLocations/SafeLocationModal';
import { SafeLocation } from '@/api/backend/locations/locationType';
import { useUserStore } from '@/lib/storage/useUserStorage';

export default function SafeLocationStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const { user, setUser } = useUserStore();
  
  // Usar directamente las ubicaciones del store
  const selectedLocations = user?.safeLocations || [];

  const handleLocationAdded = (location: SafeLocation) => {
    if (!user) return;
    
    const currentLocations = user.safeLocations || [];
    console.log("📍 Intentando añadir ubicación:", location.name, "externalId:", location.externalId);
    console.log("📍 Ubicaciones actuales:", currentLocations.map(loc => ({ name: loc.name, externalId: loc.externalId, id: loc.id })));
    
    // Verificar duplicados solo por externalId (place_id de Google) que es único
    const exists = currentLocations.find(
      (loc) => loc.externalId && location.externalId && loc.externalId === location.externalId
    );
    
    if (exists) {
      console.log("⚠️ Ubicación duplicada encontrada:", exists.name);
      Alert.alert("Ubicación duplicada", "Esta ubicación ya ha sido añadida.");
      return;
    }

    const updated = [...currentLocations, location];
    setUser({ ...user, safeLocations: updated });
    console.log("✅ Ubicación añadida exitosamente:", location);
    console.log("location id asignado:", location.id);
    console.log("📍 Total ubicaciones ahora:", updated.length);
    setModalVisible(false);
  };

  const handleRemoveLocation = (locationToRemove: SafeLocation) => {
    if (!user) return;
    
    const currentLocations = user.safeLocations || [];
    console.log("🗑️ Intentando eliminar ubicación:", locationToRemove.name);
    
    // Filtrar por externalId principalmente, y como fallback por id
    const updated = currentLocations.filter((loc) => {
      if (locationToRemove.externalId && loc.externalId) {
        return loc.externalId !== locationToRemove.externalId;
      }
      if (locationToRemove.id && loc.id) {
        return loc.id !== locationToRemove.id;
      }
      // Si no hay IDs, comparar por nombre y coordenadas como último recurso
      return !(loc.name === locationToRemove.name && 
               loc.latitude === locationToRemove.latitude && 
               loc.longitude === locationToRemove.longitude);
    });
    
    setUser({ ...user, safeLocations: updated });
    console.log("✅ Ubicación eliminada:", locationToRemove.name);
    console.log("📍 Total ubicaciones ahora:", updated.length);
  };

  const handleContinue = () => {
    const currentLocations = user?.safeLocations || [];
    if (currentLocations.length === 0) {
      Alert.alert("Atención", "Selecciona al menos una ubicación segura para continuar.");
      return;
    }

    console.log("SafeLocations seleccionadas:", currentLocations);
    onNext();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ubicaciones Seguras</Text>
        <Text style={styles.subtitle}>
          Selecciona lugares donde te sientes seguro para indicar tu estado a tus contactos.
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={18} color="#7A33CC" />
            <Text style={styles.sectionTitle}>Mis Ubicaciones Seguras</Text>
          </View>

          {selectedLocations.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No has seleccionado ubicaciones aún</Text>
              <Text style={styles.emptySubtext}>Toca el botón de abajo para añadir ubicaciones seguras</Text>
            </View>
          ) : (
            selectedLocations.map((location, index) => (
              <View key={location.externalId || location.id || index} style={styles.locationItem}>
                <View style={styles.locationIcon}>
                  <Ionicons
                    name={
                      location.type === 'hospital' ? 'medical' :
                      location.type === 'police' ? 'shield-checkmark' :
                      location.type === 'fire_station' ? 'flame' : 'location'
                    }
                    size={24}
                    color="#7A33CC"
                  />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationAddress}>{location.address}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveLocation(location)}
                >
                  <Ionicons name="close-circle" size={24} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            ))
          )}

          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Ionicons name="add-circle" size={24} color="#7A33CC" />
            <Text style={styles.addButtonText}>
              {selectedLocations.length === 0 ? 'Añadir primera ubicación' : 'Añadir otra ubicación'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Atrás</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.continueButton, selectedLocations.length === 0 && styles.continueButtonDisabled]} 
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>
            Continuar {selectedLocations.length > 0 && `(${selectedLocations.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      <SafeLocationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelectLocation={handleLocationAdded}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7A33CC',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    bottom: "5%",
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  locationItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 10,
  },
  addButtonText: {
    color: '#7A33CC',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    paddingTop: 20,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueButton: {
    flex: 2,
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  continueButtonText: {
    color: '#7A33CC',
    fontSize: 16,
    fontWeight: 'bold',
  },
});