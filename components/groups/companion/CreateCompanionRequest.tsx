import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import SafeLocationModal from '@/components/safeLocations/SafeLocationModal';
import { Location } from '@/api/backend/locations/locationType';
import { CreateCompanionRequestDto } from '@/api/backend/companionRequest/companionTypes';
import { createLocation } from '@/api/backend/locations/locationsApi';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';

interface CreateCompanionRequestProps {
  onCreateRequest: (request: CreateCompanionRequestDto) => Promise<void>;
  onSuccess?: () => void;
  onCancel?: () => void;
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
  onCancel,
}: CreateCompanionRequestProps) {
  const [sourceLocation, setSourceLocation] = useState<DisplayLocation | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<DisplayLocation | null>(null);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [aproxHour, setAproxHour] = useState<Date | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  const handleSubmit = async () => {
    if (!sourceLocation || !destinationLocation) {
      Alert.alert('Error', 'Por favor completa origen y destino');
      return;
    }

    setIsSubmitting(true);

    try {

      const token = await getToken();
      setToken(token);

      // Crear Location para origen
      const sourceLocationData: Location = {
        id: 0,
        latitude: sourceLocation.latitude,
        longitude: sourceLocation.longitude,
        timestamp: new Date().toISOString(),
        name: sourceLocation.name
      };
      const sourceId = await createLocation(sourceLocationData);
      
      if (!sourceId) {
        throw new Error('No se pudo crear la ubicación de origen');
      }

      // Crear Location para destino
      const destLocationData: Location = {
        id: 0,
        name: destinationLocation.name,
        latitude: destinationLocation.latitude,
        longitude: destinationLocation.longitude,
        timestamp: new Date().toISOString(),
      };
      const destId = await createLocation(destLocationData);
      
      if (!destId) {
        throw new Error('No se pudo crear la ubicación de destino');
      }

      // Combinar fecha actual con la hora seleccionada
      let finalDateTime: Date | undefined = undefined;
      if (aproxHour) {
        const now = new Date();
        const selectedDateTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          aproxHour.getHours(),
          aproxHour.getMinutes(),
          0,
          0
        );

        // Si la hora seleccionada ya pasó hoy, moverla al día siguiente
        if (selectedDateTime < now) {
          selectedDateTime.setDate(selectedDateTime.getDate() + 1);
        }

        finalDateTime = selectedDateTime;
      }

      // Crear la solicitud con solo los campos necesarios
      const newRequest: CreateCompanionRequestDto = {
        sourceId,
        destinationId: destId,
        aproxHour: finalDateTime,
        description: description || undefined,
      };

      await onCreateRequest(newRequest);

      // Limpiar formulario
      setSourceLocation(null);
      setDestinationLocation(null);
      setAproxHour(null);
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
    <View style={styles.fullContainer}>
      {/* Header con botón atrás */}
      {onCancel && (
        <View style={styles.header}>
          <Pressable onPress={onCancel} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </Pressable>
          <Text style={styles.headerTitle}>Nueva solicitud</Text>
          <View style={styles.placeholder} />
        </View>
      )}

      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {!onCancel && <Text style={styles.title}>Nueva solicitud de acompañamiento</Text>}

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

      {/* Hora aproximada */}
      <Text style={styles.label}>Hora aproximada de quedada</Text>
      <Pressable style={styles.input} onPress={() => setShowTimePicker(true)}>
        <View style={styles.inputContent}>
          <Ionicons name="time" size={20} color="#F59E0B" />
          <Text style={{ color: aproxHour ? '#1F2937' : '#9CA3AF', flex: 1 }}>
            {aproxHour 
              ? aproxHour.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
              : 'Selecciona la hora (opcional)'
            }
          </Text>
          {aproxHour && (
            <Pressable onPress={() => setAproxHour(null)} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </Pressable>
          )}
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </Pressable>

      {/* Modal para iOS */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={showTimePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecciona la hora</Text>
                <Pressable onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.modalDoneButton}>Listo</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={aproxHour || new Date()}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setAproxHour(selectedDate);
                  }
                }}
                textColor="#000000"
                style={styles.timePicker}
              />
            </View>
          </View>
        </Modal>
      ) : (
        showTimePicker && (
          <DateTimePicker
            value={aproxHour || new Date()}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={(event, selectedDate) => {
              setShowTimePicker(false);
              if (selectedDate) {
                setAproxHour(selectedDate);
              }
            }}
          />
        )
      )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 32,
  },
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
  // Estilos para el modal del time picker (iOS)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalDoneButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7A33CC',
  },
  timePicker: {
    height: 200,
    backgroundColor: '#FFF',
  },
});
