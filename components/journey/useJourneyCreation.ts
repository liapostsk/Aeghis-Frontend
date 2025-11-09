import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import * as ExpoLocation from 'expo-location';
import { UserDto } from '@/api/types';
import { Group } from '@/api/group/groupType';
import { Location, SafeLocation } from '@/api/locations/locationType';
import { JourneyDto, JourneyTypes, JourneyStates } from '@/api/journeys/journeyType';
import { ParticipationDto } from '@/api/participations/participationType';
import { createJourney, updateJourney } from '@/api/journeys/journeyApi';
import { createParticipation } from '@/api/participations/participationApi';
import { createLocation } from '@/api/locations/locationsApi';
import { sendMessageFirebase } from '@/api/firebase/chat/chatService';
import { createJourneyInChat } from '@/api/firebase/journey/journeyService';
import { joinJourneyParticipation } from '@/api/firebase/journey/participationsService';
import { addUserPosition } from '@/api/firebase/journey/positionsService';
import { auth } from '@/firebaseconfig';
import { JourneyType, validateJourneyForm } from './journeyUtils';

interface UseJourneyCreationProps {
  groupId: string;
  group: Group | null;
  currentUser: UserDto | null;
  members: UserDto[];
  getToken: () => Promise<string | null>;
  setToken: (token: string | null) => void;
}

export const useJourneyCreation = ({
  groupId,
  group,
  currentUser,
  members,
  getToken,
  setToken,
}: UseJourneyCreationProps) => {
  const [creating, setCreating] = useState(false);
  const [creationStep, setCreationStep] = useState('');

  // Función para obtener ubicación actual del dispositivo
  const getCurrentLocation = async (): Promise<ExpoLocation.LocationObject | null> => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu ubicación para crear el trayecto');
        return null;
      }

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
  const createLocationRecord = async (location: ExpoLocation.LocationObject): Promise<number | null> => {
    try {
      const locationData: Location = {
        id: 0,
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

  // Función para enviar mensaje de solicitud de trayecto al chat
  const sendJourneyRequestMessage = async (
    journeyId: number, 
    journeyName: string, 
    targetParticipants: number[],
    selectedDestination: SafeLocation | null
  ) => {
    try {
      if (!group?.id) return;

      const targetNames = members
        .filter(m => targetParticipants.includes(m.id))
        .map(m => m.name)
        .join(', ');

      const destinationText = selectedDestination ? selectedDestination.name : 'Por definir';

      const message = `${currentUser?.name || 'Usuario'} ha creado un nuevo trayecto grupal: "${journeyName}"
📍 Destino: ${destinationText}

ID del trayecto: ${journeyId}`;

      await sendMessageFirebase(group.id.toString(), message);
    } catch (error) {
      console.error('Error sending journey request message:', error);
      throw error;
    }
  };

  // Validación del formulario
  const validateForm = (
    journeyType: JourneyType | null,
    journeyName: string,
    selectedParticipants: number[],
    selectedDestination: SafeLocation | null
  ): boolean => {
    const formData = {
      journeyType,
      journeyName,
      selectedParticipants,
      selectedDestination
    };

    const validation = validateJourneyForm(formData);
    
    if (!validation.isValid) {
      const firstError = validation.errors[0];
      Alert.alert('Error', firstError.message);
      return false;
    }

    return true;
  };

  // Crear trayecto
  const createJourneyFlow = async (
    journeyType: JourneyType,
    journeyName: string,
    selectedParticipants: number[],
    selectedDestination: SafeLocation | null
  ) => {
    if (!validateForm(journeyType, journeyName, selectedParticipants, selectedDestination)) return;

    try {
      setCreating(true);

      // 1. Crear Journey primero
      setCreationStep('Creando trayecto...');
      const journeyData: Partial<JourneyDto> = {
        groupId: Number(groupId),
        journeyType: journeyType === 'individual' ? JourneyTypes.INDIVIDUAL : 
              journeyType === 'common_destination' ? JourneyTypes.COMMON_DESTINATION : JourneyTypes.PERSONALIZED,
        state: journeyType === 'individual' ? JourneyStates.IN_PROGRESS : JourneyStates.PENDING,
        iniDate: new Date().toISOString(),
        participantsIds: []
      };

      const token = await getToken();
      setToken(token);

      const journeyId = await createJourney(journeyData as JourneyDto);

      // Crear journey en Firebase
      setCreationStep('Configurando journey en tiempo real...');
      const chatId = group?.id?.toString();
      if (chatId) {
        await createJourneyInChat(chatId, { ...journeyData, id: journeyId } as JourneyDto);
      }

      // 2. Añadir creador como participante
      setCreationStep('Añadiéndote como participante...');
      
      const deviceLocation = await getCurrentLocation();
      if (!deviceLocation) {
        throw new Error('No se pudo obtener tu ubicación actual');
      }

      const originLocationId = await createLocationRecord(deviceLocation);
      if (!originLocationId) {
        throw new Error('No se pudo registrar tu ubicación');
      }

      // Crear ubicación de destino
      let destinationLocationId: number | undefined;
      if (selectedDestination) {
        const destLocation: Partial<Location> = {
          latitude: selectedDestination.latitude,
          longitude: selectedDestination.longitude,
          timestamp: new Date().toISOString()
        };
        destinationLocationId = await createLocation(destLocation as Location);
      }

      // Crear participación del creador
      const creatorParticipationData: Partial<ParticipationDto> = {
        journeyId: journeyId,
        userId: currentUser?.id || 0,
        sharedLocation: true,
        state: 'ACCEPTED',
        sourceId: originLocationId,
        destinationId: destinationLocationId || originLocationId
      };
      
      const creatorParticipationId = await createParticipation(creatorParticipationData as ParticipationDto);

      // Crear participación en Firebase
      if (chatId) {
        const destinationPosition = selectedDestination ? {
          latitude: selectedDestination.latitude,
          longitude: selectedDestination.longitude,
          timestamp: new Date()
        } : undefined;

        await joinJourneyParticipation(chatId, journeyId.toString(), {
          destination: destinationPosition,
          backendParticipationId: creatorParticipationId,
          initialState: 'ACCEPTED'
        });

        // Añadir posición inicial
        if (deviceLocation) {
          await addUserPosition(
            chatId, 
            journeyId.toString(), 
            auth.currentUser?.uid || '', 
            deviceLocation.coords.latitude, 
            deviceLocation.coords.longitude
          );
        }
      }

      // 3. Actualizar journey con ID de participación
      setCreationStep('Actualizando trayecto...');
      const updatedJourneyData = {
        ...journeyData,
        id: journeyId,
        participantsIds: [creatorParticipationId]
      };
      
      await updateJourney(updatedJourneyData as JourneyDto);

      // 4. Manejar según tipo
      if (journeyType === 'individual') {
        Alert.alert(
          '¡Trayecto individual creado!',
          `El trayecto "${journeyName}" está listo. Puedes iniciarlo cuando quieras desde la vista del mapa.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        setCreationStep('Enviando solicitud al grupo...');
        
        try {
          const targetParticipants = selectedParticipants.filter(id => id !== currentUser?.id);
          await sendJourneyRequestMessage(journeyId, journeyName, targetParticipants, selectedDestination);

          const participantNames = members
            .filter(m => targetParticipants.includes(m.id))
            .map(m => m.name)
            .join(', ');

          Alert.alert(
            '¡Solicitud de trayecto enviada!',
            `Se ha enviado una solicitud para el trayecto "${journeyName}" a ${participantNames}. ` +
            'Podrán unirse desde el chat del grupo seleccionando su destino.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
        } catch (chatError) {
          console.warn('Error enviando mensaje al chat:', chatError);
          Alert.alert(
            'Trayecto creado',
            `El trayecto "${journeyName}" se ha creado correctamente, pero no se pudo notificar al grupo.`,
            [{ text: 'OK', onPress: () => router.back() }]
          );
        }
      }

    } catch (error) {
      console.error('❌ Error creating journey:', error);
      Alert.alert(
        'Error', 
        'No se pudo crear el trayecto. Verifica tu conexión e inténtalo de nuevo.'
      );
    } finally {
      setCreating(false);
      setCreationStep('');
    }
  };

  return {
    creating,
    creationStep,
    createJourneyFlow,
  };
};
