import { router } from 'expo-router';
import { StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapHeader from '@/components/map/MapHeader';
import PeopleOnMap from '@/components/map/PeopleOnMap';
import JourneyOverlay from '@/components/map/JourneyOverlay';
import EmergencyButton from '@/components/map/EmergencyButton';
import { useState, useEffect } from 'react';
import { Group } from '@/api/group/groupType';
import { JourneyDto, JourneyStates } from '@/api/journeys/journeyType';
import { updateJourney } from '@/api/journeys/journeyApi';
import { updateJourneyState } from '@/api/firebase/journey/journeyService';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import * as Notifications from 'expo-notifications';

interface GroupWithJourney {
  group: Group;
  activeJourney: JourneyDto;
}

export default function MapScreen() {

  // Estado real conectado entre componentes
  const [selectedGroupJourney, setSelectedGroupJourney] = useState<GroupWithJourney | null>(null);


  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  // ✅ Notificación de prueba al entrar al mapa
  useEffect(() => {
    const sendWelcomeNotification = async () => {
      try {
        console.log('🔔 [MapScreen] Enviando notificación de bienvenida...');
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Bienvenido al Mapa 🗺️",
            body: "¡Aegis está listo para protegerte! Tus notificaciones funcionan correctamente.",
            data: { 
              type: 'welcome',
              screen: 'map',
              timestamp: Date.now() 
            },
          },
          trigger: { 
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 2, // 2 segundos después de entrar
          },
        });
        
        console.log('✅ [MapScreen] Notificación de prueba programada');
      } catch (error) {
        console.error('❌ [MapScreen] Error enviando notificación:', error);
      }
    };

    sendWelcomeNotification();
  }, []); // Solo se ejecuta al montar el componente

  const handleStartJourney = async () => {
    console.log('🚀 handleStartJourney - Iniciando proceso...');
    
    // Si no hay journey seleccionado, navegar a crear uno nuevo
    if (!selectedGroupJourney?.activeJourney) {
      console.log('📝 No hay journey activo, navegando a crear uno nuevo');
      router.push('/chat/journey');
      return;
    }

    const journey = selectedGroupJourney.activeJourney;
    const chatId = selectedGroupJourney.group.id.toString();
    
    console.log('🎯 Journey a iniciar:', {
      journeyId: journey.id,
      currentState: journey.state,
      chatId: chatId,
      groupName: selectedGroupJourney.group.name
    });

    // Si el journey ya está activo, mostrar mensaje
    if (journey.state === JourneyStates.IN_PROGRESS) {
      console.log('✅ Journey ya está activo');
      Alert.alert('Journey Activo', 'El journey ya está en progreso');
      return;
    }

    try {
      console.log('🔄 Actualizando estado del journey a IN_PROGRESS...');
      
      // Obtener token de autenticación
      const token = await getToken();
      setToken(token);
      
      // 1. Actualizar en el backend
      const updatedJourneyData = {
        ...journey,
        state: JourneyStates.IN_PROGRESS,
        iniDate: new Date().toISOString(), // Actualizar fecha de inicio
      };
      
      console.log('💾 Actualizando journey en backend...');
      await updateJourney(updatedJourneyData);
      console.log('✅ Journey actualizado en backend');

      // 2. Actualizar en Firebase
      console.log('🔥 Actualizando journey en Firebase...');
      await updateJourneyState(chatId, journey.id.toString(), 'IN_PROGRESS');
      console.log('✅ Journey actualizado en Firebase');

      // 3. Actualizar el estado local con los datos actualizados
      setSelectedGroupJourney({
        ...selectedGroupJourney,
        activeJourney: updatedJourneyData
      });

      console.log('🎉 Journey iniciado exitosamente');
      Alert.alert(
        'Journey Iniciado', 
        `El journey "${journey.journeyType === 'INDIVIDUAL' ? 'individual' : 'grupal'}" ha comenzado. ${journey.journeyType !== 'INDIVIDUAL' ? 'Todos los participantes pueden ver las ubicaciones en tiempo real.' : 'Tu ubicación se está compartiendo.'}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('💥 Error iniciando journey:', error);
      Alert.alert(
        'Error al Iniciar Journey', 
        'No se pudo iniciar el journey. ¿Qué deseas hacer?',
        [
          { text: 'Crear Nuevo', onPress: () => router.push('/chat/journey') },
          { text: 'Reintentar', onPress: () => handleStartJourney() },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    }
  };

  const handleCompleteJourney = async () => {
    if (!selectedGroupJourney?.activeJourney) return;

    const journey = selectedGroupJourney.activeJourney;
    const chatId = selectedGroupJourney.group.id.toString();
    
    console.log('🏁 handleCompleteJourney - Finalizando journey:', journey.id);

    // Confirmar con el usuario
    Alert.alert(
      '¿Finalizar Journey?',
      '¿Estás seguro de que quieres finalizar este journey?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Finalizar', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔄 Finalizando journey...');
              
              // Obtener token de autenticación
              const token = await getToken();
              setToken(token);

              // 1. Actualizar en el backend
              const updatedJourneyData = {
                ...journey,
                state: JourneyStates.COMPLETED,
                endDate: new Date().toISOString(),
              };

              console.log('💾 Actualizando journey en backend...');
              await updateJourney(updatedJourneyData);
              console.log('✅ Journey completado en backend');

              // 2. Actualizar en Firebase
              console.log('🔥 Actualizando journey en Firebase...');
              await updateJourneyState(chatId, journey.id.toString(), 'COMPLETED');
              console.log('✅ Journey completado en Firebase');

              // 3. Limpiar el estado local
              setSelectedGroupJourney(null);

              console.log('🎉 Journey completado exitosamente');
              Alert.alert('Journey Completado', 'El journey ha finalizado correctamente.');

            } catch (error) {
              console.error('💥 Error completando journey:', error);
              Alert.alert('Error', 'No se pudo completar el journey. Intenta de nuevo.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      
      <MapHeader 
        activeGroupJourney={selectedGroupJourney}
        onGroupJourneySelect={setSelectedGroupJourney}
      />
      <PeopleOnMap />
      <EmergencyButton onPress={() => console.log('Emergency triggered')} />
      <JourneyOverlay 
        groupJourney={selectedGroupJourney}
        onStartJourney={handleStartJourney}
        onCompleteJourney={handleCompleteJourney}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  logoutButton: {
    margin: 20,
    padding: 12,
    backgroundColor: '#FF4D4D',
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

});
