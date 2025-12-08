import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeLocationModal from '@/components/safeLocations/SafeLocationModal';
import { Location } from '@/api/backend/locations/locationType';
import { CompanionRequestDto } from '@/api/backend/types';
import { createLocation } from '@/api/backend/locations/locationsApi';

interface CreateCompanionRequestProps {
  onCreateRequest: (request: Partial<CompanionRequestDto>, sourceId: number, destinationId: number) => Promise<void>;
  onSuccess?: () => void;
}

// Tipo para mostrar en UI
type DisplayLocation = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  id?: number;
};

export default function CreateCompanionRequest({
  onCreateRequest,
  onSuccess,
}: CreateCompanionRequestProps) {
  const [sourceLocation, setSourceLocation] = useState<DisplayLocation | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<DisplayLocation | null>(null);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [aproxHour, setAproxHour] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!sourceLocation || !destinationLocation) {
      Alert.alert('Error', 'Por favor completa origen y destino');
      return;
    }

    setIsSubmitting(true);

    try {
      // Crear Location para origen
      const sourceLocationData: Location = {
        id: 0,
        latitude: sourceLocation.latitude,
        longitude: sourceLocation.longitude,
        timestamp: new Date().toISOString(),
      };
      const sourceId = await createLocation(sourceLocationData);
      
      if (!sourceId) {
        throw new Error('No se pudo crear la ubicación de origen');
      }

      // Crear Location para destino
      const destLocationData: Location = {
        id: 0,
        latitude: destinationLocation.latitude,
        longitude: destinationLocation.longitude,
        timestamp: new Date().toISOString(),
      };
      const destId = await createLocation(destLocationData);
      
      if (!destId) {
        throw new Error('No se pudo crear la ubicación de destino');
      }

      // Crear la solicitud con los IDs
      await onCreateRequest(
        {
          description: description || undefined,
        },
        sourceId,
        destId
      );

      // Limpiar formulario
      setSourceLocation(null);
      setDestinationLocation(null);
      setAproxHour('');
      setDescription('');

      Alert.alert('Éxito', 'Solicitud de acompañamiento creada');
      onSuccess?.();
    } catch (error) {
      console.error('Error creando solicitud:', error);
      Alert.alert('Error', 'No se pudo crear la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Nueva solicitud de acompañamiento</Text>

      {/* Origen */}
      <Text style={styles.label}>Origen *</Text>
      <Pressable style={styles.input} onPress={() => setShowSourceModal(true)}>
        <View style={styles.inputContent}>
          <Ionicons name="location" size={20} color="#7A33CC" />
          <Text style={{ color: sourceLocation ? '#1F2937' : '#9CA3AF', flex: 1 }}>
            {sourceLocation ? sourceLocation.name : 'Selecciona el origen'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </Pressable>
      <SafeLocationModal
        visible={showSourceModal}
        onClose={() => setShowSourceModal(false)}
        onSelectLocation={(loc) => {
          // Extraer info para mostrar en UI
          const displayLoc: DisplayLocation = {
            name: ('name' in loc && loc.name) ? loc.name : 'Ubicación personalizada',
            address: ('address' in loc && loc.address) ? loc.address : `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`,
            latitude: loc.latitude,
            longitude: loc.longitude,
            id: loc.id,
          };
          setSourceLocation(displayLoc);
          setShowSourceModal(false);
        }}
        title="Selecciona el origen"
        acceptLocationTypes="all"
      />

      {/* Destino */}
      <Text style={styles.label}>Destino *</Text>
      <Pressable style={styles.input} onPress={() => setShowDestinationModal(true)}>
        <View style={styles.inputContent}>
          <Ionicons name="location" size={20} color="#EF4444" />
          <Text style={{ color: destinationLocation ? '#1F2937' : '#9CA3AF', flex: 1 }}>
            {destinationLocation ? destinationLocation.name : 'Selecciona el destino'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </Pressable>
      <SafeLocationModal
        visible={showDestinationModal}
        onClose={() => setShowDestinationModal(false)}
        onSelectLocation={(loc) => {
          // Extraer info para mostrar en UI
          const displayLoc: DisplayLocation = {
            name: ('name' in loc && loc.name) ? loc.name : 'Ubicación personalizada',
            address: ('address' in loc && loc.address) ? loc.address : `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`,
            latitude: loc.latitude,
            longitude: loc.longitude,
            id: loc.id,
          };
          setDestinationLocation(displayLoc);
          setShowDestinationModal(false);
        }}
        title="Selecciona el destino"
        acceptLocationTypes="all"
      />

      {/* Descripción */}
      <Text style={styles.label}>Descripción (opcional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Añade detalles sobre el trayecto..."
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={setDescription}
        textAlignVertical="top"
      />

      {/* Información adicional */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#7A33CC" />
        <Text style={styles.infoText}>
          Tu solicitud será visible para otros usuarios que puedan acompañarte en tu trayecto.
        </Text>
      </View>

      {/* Botón crear */}
      <Pressable 
        style={[styles.createButton, isSubmitting && styles.createButtonDisabled]} 
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Ionicons name="checkmark-circle" size={20} color="#FFF" />
        <Text style={styles.createButtonText}>
          {isSubmitting ? 'Creando...' : 'Crear solicitud'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F3E8FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6B21A8',
    lineHeight: 18,
  },
  createButton: {
    backgroundColor: '#7A33CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    marginVertical: 24,
  },
  createButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
