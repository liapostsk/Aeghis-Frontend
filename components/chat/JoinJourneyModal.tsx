import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JourneyDto, JourneyTypes } from '@/api/backend/journeys/journeyType';
import { ParticipationDto } from '@/api/backend/participations/participationType';
import { UserDto } from '@/api/backend/types';
import { SafeLocation, Location, SelectableLocation, toSafeLocation } from '@/api/backend/locations/locationType';
import { createParticipation } from '@/api/backend/participations/participationApi';
import { createLocation } from '@/api/backend/locations/locationsApi';
import * as ExpoLocation from 'expo-location';
import SafeLocationModal from '@/components/safeLocations/SafeLocationModal';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { joinJourneyParticipation } from '@/api/firebase/journey/participationsService';
import { addUserPosition } from '@/api/firebase/journey/positionsService';
import { auth } from '@/firebaseconfig';

interface JoinJourneyModalProps {
  visible: boolean;
  onClose: () => void;
  journey: JourneyDto;
  currentUser: UserDto | null;
  onJoinSuccess: (participation: ParticipationDto) => void;
  chatId: string; // ID del chat para Firebase
}

export default function JoinJourneyModal({
  visible,
  onClose,
  journey,
  currentUser,
  onJoinSuccess,
  chatId
}: JoinJourneyModalProps) {
  
  const [loading, setLoading] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<SafeLocation | null>(null);
  const [showDestinationModal, setShowDestinationModal] = useState(false);

  const isPersonalizedJourney = journey.journeyType === JourneyTypes.PERSONALIZED;
  const isCommonDestination = journey.journeyType === JourneyTypes.COMMON_DESTINATION;

  const { getToken } = useAuth(); // Hook para obtener el token de autenticación
  const setToken = useTokenStore((state) => state.setToken);

  // Función para obtener ubicación actual del dispositivo
  const getCurrentLocation = async (): Promise<ExpoLocation.LocationObject | null> => {
    try {
      // Verificar permisos
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu ubicación para unirte al trayecto');
        return null;
      }

      // Obtener ubicación actual
      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.High,
      });
      return location;
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
      return null;
    }
  };

  // Función para crear registro de ubicación en backend
  const createLocationRecord = async (location: ExpoLocation.LocationObject, name?: string): Promise<number | null> => {
    try {
      const locationData: Location = {
        id: 0, // Se asignará en el backend
        name: name,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
      };

      const createdLocationId = await createLocation(locationData);
      return createdLocationId;
    } catch (error) {
      console.error('Error creating location record:', error);
      return null;
    }
  };

  const handleJoinJourney = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'No se pudo obtener la información del usuario');
      return;
    }

    // Validar que para journeys personalizados se haya seleccionado destino
    if (isPersonalizedJourney && !selectedDestination) {
      Alert.alert('Destino requerido', 'Para trayectos personalizados debes seleccionar tu destino');
      return;
    }

    try {
      setLoading(true);

      // 1. Obtener ubicación actual como origen
      const deviceLocation = await getCurrentLocation();
      if (!deviceLocation) {
        throw new Error('No se pudo obtener tu ubicación actual');
      }

      // 2. Crear ubicación de origen
      const originLocationId = await createLocationRecord(deviceLocation, 'Mi ubicación');
      if (!originLocationId) {
        throw new Error('No se pudo registrar tu ubicación de origen');
      }

      const token = await getToken();
      setToken(token);

      // 3. Crear ubicación de destino
      let destinationLocationId: number;

      if (isPersonalizedJourney && selectedDestination) {
        // Para personalized: crear nueva ubicación con el destino seleccionado
        const destLocation: Location = {
          id: 0,
          name: selectedDestination.name,
          latitude: selectedDestination.latitude,
          longitude: selectedDestination.longitude,
          timestamp: new Date().toISOString()
        };
        const destId = await createLocation(destLocation);
        if (!destId) {
          throw new Error('No se pudo registrar tu destino');
        }
        destinationLocationId = destId;
      } else {
        // Para common_destination o individual, usar la ubicación de origen
        destinationLocationId = originLocationId;
      }

      // 4. Crear participación
      const participationData: Partial<ParticipationDto> = {
        journeyId: journey.id,
        userId: currentUser.id,
        sharedLocation: true, // Por defecto compartir ubicación
        state: 'ACCEPTED', // Auto-aceptar la participación
        sourceId: originLocationId,
        destinationId: destinationLocationId
      };

      // Al crear la participación, el usuario se une al journey
      const participationId = await createParticipation(participationData as ParticipationDto);
      console.log('Participación creada con ID:', participationId);

      // 5.5. Sincronizar con Firebase
      try {
        const destinationPosition = selectedDestination ? {
          latitude: selectedDestination.latitude,
          longitude: selectedDestination.longitude,
          timestamp: new Date()
        } : undefined;

        if (!journey.id) {
          throw new Error('Journey ID no disponible');
        }

        await joinJourneyParticipation(chatId, journey.id.toString(), {
          destination: destinationPosition,
          backendParticipationId: participationId,
          initialState: 'ACCEPTED'
        });
        console.log('Participación sincronizada con Firebaseeeeeeee');
        // Añadir posición inicial
        if (deviceLocation && auth.currentUser?.uid) {
          await addUserPosition(
            chatId,
            journey.id.toString(),
            auth.currentUser.uid,
            deviceLocation.coords.latitude,
            deviceLocation.coords.longitude
          );
        }

        console.log('Participación sincronizada con Firebase');
      } catch (firebaseError) {
        console.warn('Error sincronizando con Firebase:', firebaseError);
        // No fallar la operación principal por errores de Firebase
      }

      // 6. Notificar éxito
      const createdParticipation: ParticipationDto = {
        ...(participationData as ParticipationDto),
        id: participationId
      };

      onJoinSuccess(createdParticipation);
      
      Alert.alert(
        '¡Te has unido al trayecto!',
        isPersonalizedJourney 
          ? `Te has unido al trayecto con destino a ${selectedDestination?.name || 'tu ubicación seleccionada'}.`
          : 'Te has unido al trayecto grupal.',
        [{ text: 'OK', onPress: onClose }]
      );

    } catch (error) {
      console.error('Error joining journey:', error);
      Alert.alert(
        'Error', 
        'No se pudo unir al trayecto. Verifica tu conexión e inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDestination = (location: SelectableLocation) => {
    const safeLocation = toSafeLocation(location);
    setSelectedDestination(safeLocation);
    setShowDestinationModal(false);
  };

  // Nueva función: Manejar apertura del modal de destino
  const handleOpenDestinationModal = () => {
    setShowDestinationModal(true);
  };

  // Nueva función: Manejar cierre del modal de destino
  const handleCloseDestinationModal = () => {
    setShowDestinationModal(false);
  };

  const getJourneyTypeDisplayName = () => {
    const typeNames = {
      'INDIVIDUAL': 'Individual',
      'COMMON_DESTINATION': 'Grupal con destino común',
      'PERSONALIZED': 'Grupal personalizado'
    };
    return typeNames[journey.journeyType] || 'Desconocido';
  };

  return (
    <>
      <Modal
        visible={visible && !showDestinationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
            <Text style={styles.headerTitle}>Unirse al trayecto</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Journey Info */}
            <View style={styles.journeyInfo}>
              <View style={styles.journeyIcon}>
                <Ionicons 
                  name={journey.state === 'IN_PROGRESS' ? 'navigate-circle' : 'time'} 
                  size={32} 
                  color="#7A33CC" 
                />
              </View>
              
              <Text style={styles.journeyTitle}>
                {getJourneyTypeDisplayName()}
              </Text>
              
              <Text style={styles.journeyState}>
                Estado: {journey.state === 'IN_PROGRESS' ? 'En progreso' : 'Pendiente'}
              </Text>
              
              <Text style={styles.journeyDate}>
                Creado: {new Date(journey.iniDate).toLocaleDateString()}
              </Text>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>
                {isPersonalizedJourney ? 'Selecciona tu destino' : 'Información del trayecto'}
              </Text>
              
              <Text style={styles.instructionsText}>
                {isPersonalizedJourney 
                  ? 'En un trayecto personalizado, cada participante puede tener su propio destino. Selecciona el tuyo a continuación.'
                  : 'En este trayecto grupal, todos los participantes comparten el mismo destino. Al unirte, seguirás la ruta común del grupo.'
                }
              </Text>
            </View>

            {/* Destination Selection for Personalized Journeys */}
            {isPersonalizedJourney && (
              <View style={styles.destinationSection}>
                <Text style={styles.sectionTitle}>Tu destino *</Text>
                
                <Pressable 
                  style={[
                    styles.destinationButton,
                    selectedDestination && styles.destinationButtonSelected
                  ]}
                  onPress={handleOpenDestinationModal}
                >
                  <View style={styles.destinationContent}>
                    <Ionicons 
                      name={selectedDestination ? "location" : "location-outline"} 
                      size={20} 
                      color={selectedDestination ? "#7A33CC" : "#6B7280"} 
                    />
                    <View style={styles.destinationText}>
                      <Text style={[
                        styles.destinationName,
                        selectedDestination && styles.destinationNameSelected
                      ]}>
                        {selectedDestination ? selectedDestination.name : 'Seleccionar destino'}
                      </Text>
                      {selectedDestination && (
                        <Text style={styles.destinationAddress}>
                          {selectedDestination.address}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </View>
                </Pressable>
              </View>
            )}

            {/* Warning for Common Destination */}
            {isCommonDestination && (
              <View style={styles.warningContainer}>
                <Ionicons name="information-circle" size={20} color="#F59E0B" />
                <Text style={styles.warningText}>
                  Al unirte a este trayecto, seguirás la ruta común hacia el destino compartido del grupo.
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <Pressable 
              style={styles.cancelButton} 
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
            
            <Pressable 
              style={[
                styles.joinButton,
                (loading || (isPersonalizedJourney && !selectedDestination)) && styles.joinButtonDisabled
              ]}
              onPress={handleJoinJourney}
              disabled={loading || (isPersonalizedJourney && !selectedDestination)}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.joinButtonText}>Unirse al trayecto</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Destination Selection Modal - Ahora se muestra independientemente */}
      <SafeLocationModal
        visible={showDestinationModal}
        onClose={handleCloseDestinationModal}
        onSelectLocation={handleSelectDestination}
        title="Seleccionar tu destino"
        acceptLocationTypes="all"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  journeyInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 24,
  },
  journeyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  journeyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  journeyState: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  journeyDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  instructionsContainer: {
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  destinationSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  destinationButton: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  destinationButtonSelected: {
    borderColor: '#7A33CC',
    backgroundColor: '#F8FAFC',
  },
  destinationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  destinationText: {
    flex: 1,
    marginLeft: 12,
  },
  destinationName: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  destinationNameSelected: {
    color: '#1F2937',
  },
  destinationAddress: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    lineHeight: 20,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  joinButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#7A33CC',
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});