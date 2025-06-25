import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Pressable } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import SafeLocationModal from '@/components/profile/SafeLocationModal';
import { SafeLocation } from '@/api/types';
import { createSafeLocation } from '../../api/safeLocations/safeLocationApi';
import { getCurrentUser } from '@/api/user/userApi';
import { useTokenStore } from '../../lib/auth/tokenStore';
import { useAuth } from "@clerk/clerk-expo";
import { useUserStore } from '@/lib/storage/useUserStorage';
import EditItemModal from './EditItemModel';
import { editSafeLocation } from '../../api/safeLocations/safeLocationApi';

interface Props {
  locations: SafeLocation[]; // Lista de ubicaciones seguras
  editable?: boolean; // Si se puede editar o no
  onAddLocation?: (location: SafeLocation) => void; // Para pasar al padre si se desea
}

export default function SafeLocationsSection({ locations, editable, onAddLocation }: Props) {
  // Estado para manejar la visibilidad del modal de añadir ubicación
  const [modalAddSaveLocationVisible, setModalAddSaveLocationVisible] = useState(false);
  const [localLocations, setLocalLocations] = useState<SafeLocation[]>(locations);

  // Estado para manejar la visibilidad del modal de editor
  const [modalEditorVisible, setModalEditorVisible] = useState(editable || false);

  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  const handleEditLocation = async (updated: SafeLocation) => {
    const token = await getToken();
    setToken(token);
    await editSafeLocation(updated.id!, updated); // tu función API PUT
    await getCurrentUser();
    await useUserStore.getState().refreshUserFromBackend();
  };

  const handleLocationAdded = async (location: SafeLocation) => {
    console.log("🧪 Nueva ubicación añadida desde modal:", location);
    const exists = localLocations.find(
      (loc) => loc.externalId === location.externalId
    );
    if (!exists) {
      const updated = [...localLocations, location];
      setLocalLocations(updated);
      // Llamada a la API para guardar la ubicación
      const token = await getToken();
      console.log("Token:", token);
      if (!token) {
        return Alert.alert("Error", "Failed to get token.");
      }
      setToken(token); // <—— necesario
      await createSafeLocation(location);
      // Actualizar el usuario en el store
      await getCurrentUser();
      await useUserStore.getState().refreshUserFromBackend();
      onAddLocation?.(location); // Notificar al componente padre si hace falta
    }
  };

  useEffect(() => {
    console.log("SafeLocations seleccionadas:", localLocations);
  }, [localLocations]);


  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="location" size={18} color="#7A33CC" />
        <Text style={styles.sectionTitle}>Ubicaciones Seguras</Text>
        {editable && (
          <Pressable style={styles.editButton} onPress={() => setModalEditorVisible(true)}>
            <Feather name="edit-2" size={18} color="#7A33CC" />
          </Pressable>
        )}
      </View>

      {localLocations.map((location, index) => (
        <View key={index} style={styles.locationItem}>
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
          </View>
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

      <EditItemModal
        visible={modalEditorVisible}
        locations={localLocations}
        onClose={() => setModalEditorVisible(false)}
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
});
