import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Pressable } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import SafeLocationModal from '@/components/safeLocations/SafeLocationModal';
import { SafeLocation } from '@/api/locations/locationType';
import { createSafeLocation, deleteSafeLocation } from '@/api/locations/safeLocations/safeLocationApi';
import { getCurrentUser } from '@/api/user/userApi';
import { useTokenStore } from '../../lib/auth/tokenStore';
import { useAuth } from "@clerk/clerk-expo";
import { useUserStore } from '@/lib/storage/useUserStorage';
import { editSafeLocation } from '@/api/locations/safeLocations/safeLocationApi';
import LocationEditorModal from '../safeLocations/LocationEditorModal';

interface Props {
  locations: SafeLocation[]; // Lista de ubicaciones seguras
  onAddLocation?: (location: SafeLocation) => void; // Para pasar al padre si se desea
}

export default function SafeLocationsSection({ locations, onAddLocation }: Props) {
  const [modalAddSaveLocationVisible, setModalAddSaveLocationVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SafeLocation | null>(null);
  const [editable, setEditable] = useState(false);
  const [modalEditorVisible, setModalEditorVisible] = useState(false);

  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setEditable(false);
        setModalEditorVisible(false);
        setModalAddSaveLocationVisible(false);
        setSelectedLocation(null);
      };
    }, [])
  );

  const handleEditLocation = async (updated: SafeLocation) => {
    const token = await getToken();
    setToken(token);

    await editSafeLocation(updated.id!, updated);
    await getCurrentUser();
    await useUserStore.getState().refreshUserFromBackend();
  };

  const handleLocationAdded = async (location: SafeLocation) => {
    console.log("🧪 Nueva ubicación añadida desde modal:", location);
    try {
      const token = await getToken();
      if (!token) {
        return Alert.alert("Error", "Failed to get token.");
      }
      setToken(token);
      
      const id = await createSafeLocation(location);
      location.id = id; // Asignar el ID devuelto al objeto de ubicación
      await getCurrentUser();
      await useUserStore.getState().refreshUserFromBackend();
      onAddLocation?.(location);
    } catch (error) {
      console.error("Error al guardar ubicación:", error);
      Alert.alert("Error", "No se pudo guardar la ubicación");
    }
  };

  const handleDeleteSafeLocation = async (location: SafeLocation) => {
    Alert.alert(
      "Eliminar Ubicación",
      `¿Estás seguro de que quieres eliminar "${location.name}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          onPress: async () => {
            const token = await getToken();
            setToken(token);
            await deleteSafeLocation(location.id!); // tu función API DELETE
            await getCurrentUser();
            await useUserStore.getState().refreshUserFromBackend();
          },
          style: "destructive",
        },
      ]
    );
  };
  
  /*   * Efecto para depurar las ubicaciones seleccionadas
  useEffect(() => {
    console.log("SafeLocations seleccionadas:", localLocations);
  }, [localLocations]);
  */

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="location" size={18} color="#7A33CC" />
        <Text style={styles.sectionTitle}>Ubicaciones Seguras</Text>
          <Pressable style={styles.editButton} onPress={() => setEditable(!editable)}>
            <Text style={{ color: '#7A33CC' }}>Editar</Text>
          </Pressable>
      </View>

      {locations.map((location, index) => (
        <View key={location.id || `temp-${index}`} style={styles.locationItem}>
          <View style={styles.locationIcon}>
            <Ionicons
              name={
                location.type === 'Hogar'
                  ? 'home'
                  : location.type === 'Trabajo'
                  ? 'business'
                  : 'people'
              }
              size={24}
              color="#7A33CC"
            />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationName}>{location.name}</Text>
            <Text style={styles.locationType}>{location.type}</Text>
            <Text style={styles.locationAddress}>{location.address}</Text>
            <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>ID: {location.id}</Text>
          </View>
          {editable && (
            <View style={styles.actionButtons}>
              {/* Botón de editar */}
              <Pressable 
                style={[styles.actionButton, styles.editActionButton]} 
                onPress={() => {
                  console.log("Editar ubicación:", location);
                  setSelectedLocation(location);
                  setModalEditorVisible(true);
                }}
              >
                <Feather name="edit-2" size={16} color="#7A33CC" />
              </Pressable>
              {/* Botón de eliminar */}
              {locations.length > 1 && (
                <Pressable 
                  style={[styles.actionButton, styles.deleteActionButton]} 
                  onPress={() => handleDeleteSafeLocation(location)}
                >
                  <Feather name="trash-2" size={16} color="#ff4444" />
                </Pressable>
              )}
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={() => setModalAddSaveLocationVisible(true)}>
        <Ionicons name="add-circle" size={24} color="#7A33CC" />
        <Text style={styles.addButtonText}>Añadir ubicación</Text>
      </TouchableOpacity>

      <SafeLocationModal
        visible={modalAddSaveLocationVisible}
        onClose={() => setModalAddSaveLocationVisible(false)}
        onSelectLocation={(location) => {
          handleLocationAdded(location);
          setModalAddSaveLocationVisible(false);
        }}
      />

      <LocationEditorModal
        visible={modalEditorVisible}
        location={selectedLocation || locations[0]}
        onClose={() => {
          setModalEditorVisible(false);
          setSelectedLocation(null);
        }}
        onSave={handleEditLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    margin: 16,
    marginTop: 8,
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
  locationType: {
    fontSize: 14,
    color: '#666',
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  editButton: {
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
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  editActionButton: {
    backgroundColor: '#f0f0ff',
  },
  deleteActionButton: {
    backgroundColor: '#fff0f0',
  },
});
