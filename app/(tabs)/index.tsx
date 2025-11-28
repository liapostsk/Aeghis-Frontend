
import { router } from 'expo-router';
import { StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapHeader from '@/components/map/MapHeader';
import PeopleOnMap from '@/components/map/PeopleOnMap';
import JourneyOverlay from '@/components/map/JourneyOverlay';
import EmergencyButton from '@/components/map/EmergencyButton';
import AlertModal from '@/components/common/AlertModal';
import { useEffect, useState } from 'react';
import { getParticipants } from '@/api/firebase/journey/participationsService';
import { Group } from '@/api/backend/group/groupType';
import { JourneyDto, JourneyStates } from '@/api/backend/journeys/journeyType';
import { changeJourneyStatus } from '@/api/backend/journeys/journeyApi';
import { updateJourneyState } from '@/api/firebase/journey/journeyService';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';


interface GroupWithJourney {
  group: Group;
  activeJourney: JourneyDto;
}

// Tipos de modales
type ModalType = 
  | 'journeyActive' 
  | 'journeyStarted' 
  | 'journeyError' 
  | 'confirmComplete' 
  | 'journeyCompleted' 
  | 'completeError'
  | null;

interface ModalState {
  type: ModalType;
  message?: string;
}

export default function MapScreen() {
  const [selectedGroupJourney, setSelectedGroupJourney] = useState<GroupWithJourney | null>(null);
  const [modalState, setModalState] = useState<ModalState>({ type: null });
  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  // --- PARTICIPANTS LOGIC ---
  const chatId = selectedGroupJourney?.group.id ? selectedGroupJourney.group.id.toString() : undefined;
  const journeyId = selectedGroupJourney?.activeJourney?.id ? selectedGroupJourney.activeJourney.id.toString() : undefined;
  const journeyState = selectedGroupJourney?.activeJourney?.state;
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    if (chatId && journeyId) {
      getParticipants(chatId, journeyId).then(setParticipants);
    } else {
      setParticipants([]);
    }
  }, [chatId, journeyId]);

  /*
  Enviar notificación de bienvenida al entrar al mapa
  useEffect(() => {
    if (user?.id) {
      console.log('🔔 [MapScreen] Enviando notificación de bienvenida...');
      sendWelcomeNotification(user.id);
    }
  }, []); // Solo se ejecuta al montar el componente
  */

  const handleStartJourney = async () => {
    if (!selectedGroupJourney?.activeJourney) {
      router.push('/chat/journey');
      return;
    }

    const { activeJourney: journey, group } = selectedGroupJourney;
    
    if (journey.state === JourneyStates.IN_PROGRESS) {
      setModalState({ type: 'journeyActive' });
      return;
    }

    try {
      const token = await getToken();
      setToken(token);
      
      const updatedJourneyData = {
        ...journey,
        state: JourneyStates.IN_PROGRESS,
        iniDate: new Date().toISOString(),
      };

      await changeJourneyStatus(journey.id, 'IN_PROGRESS');
      console.log('✅ Journey iniciado en backend');
      
      await updateJourneyState(group.id.toString(), journey.id.toString(), 'IN_PROGRESS');

      setSelectedGroupJourney({
        ...selectedGroupJourney,
        activeJourney: updatedJourneyData
      });

      const message = journey.journeyType === 'INDIVIDUAL' 
        ? 'Tu ubicación se está compartiendo.'
        : 'Todos los participantes pueden ver las ubicaciones en tiempo real.';
      
      setModalState({ type: 'journeyStarted', message });

    } catch (error) {
      console.error('Error iniciando journey:', error);
      setModalState({ type: 'journeyError' });
    }
  };

  const handleCompleteJourney = async () => {
    if (!selectedGroupJourney?.activeJourney) return;
    setModalState({ type: 'confirmComplete' });
  };

  const confirmCompleteJourney = async () => {
    if (!selectedGroupJourney?.activeJourney) return;

    const { activeJourney: journey, group } = selectedGroupJourney;

    try {
      const token = await getToken();
      setToken(token);

      const updatedJourneyData = {
        ...journey,
        state: JourneyStates.COMPLETED,
        endDate: new Date().toISOString(),
      };

      await changeJourneyStatus(journey.id, 'COMPLETED');
      await updateJourneyState(group.id.toString(), journey.id.toString(), 'COMPLETED');

      setSelectedGroupJourney(null);
      setModalState({ type: 'journeyCompleted' });

    } catch (error) {
      console.error('Error completando journey:', error);
      setModalState({ type: 'completeError' });
    }
  };
  
  const closeModal = () => {
    setModalState({ type: null });
  };
  

  /*
  const handleLogout = async () => {
    await unlinkFirebaseSession();
    await signOut();
    clearUser();
    console.log("🔒 Sesión cerrada");
    router.replace("/(auth)");
  };

  <Pressable 
    style={styles.debugLogoutButton} 
    onPress={handleLogout}
  >
    <Text>🔒 Cerrar sesión</Text>
  </Pressable>
  */

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <MapHeader 
        activeGroupJourney={selectedGroupJourney}
        onGroupJourneySelect={setSelectedGroupJourney}
      />
      <PeopleOnMap 
        chatId={chatId}
        journeyId={journeyId}
        journeyState={journeyState}
        participants={participants}
      />
      <EmergencyButton onPress={() => console.log('✅ Emergencia procesada correctamente')} />
      <JourneyOverlay 
        groupJourney={selectedGroupJourney}
        onStartJourney={handleStartJourney}
        onCompleteJourney={handleCompleteJourney}
      />

      {/* Modal: Journey ya está activo */}
      <AlertModal
        visible={modalState.type === 'journeyActive'}
        type="warning"
        title="Journey Activo"
        message="El journey ya está en progreso"
        confirmText="Entendido"
        showCancelButton={false}
        onConfirm={closeModal}
      />

      {/* Modal: Journey iniciado con éxito */}
      <AlertModal
        visible={modalState.type === 'journeyStarted'}
        type="success"
        title="Journey Iniciado"
        message={`El journey ha comenzado. ${modalState.message || ''}`}
        confirmText="Continuar"
        showCancelButton={false}
        onConfirm={closeModal}
      />

      {/* Modal: Error al iniciar journey */}
      <AlertModal
        visible={modalState.type === 'journeyError'}
        type="danger"
        title="Error al Iniciar Journey"
        message="No se pudo iniciar el journey. ¿Qué deseas hacer?"
        confirmText="Crear Nuevo"
        cancelText="Cancelar"
        onConfirm={() => {
          closeModal();
          router.push('/chat/journey');
        }}
        onCancel={closeModal}
      />

      {/* Modal: Confirmar finalizar journey */}
      <AlertModal
        visible={modalState.type === 'confirmComplete'}
        type="warning"
        title="¿Finalizar Journey?"
        message="¿Estás seguro de que quieres finalizar este journey?"
        confirmText="Finalizar"
        cancelText="Cancelar"
        confirmButtonColor="#EF4444"
        onConfirm={() => {
          closeModal();
          confirmCompleteJourney();
        }}
        onCancel={closeModal}
      />

      {/* Modal: Journey completado */}
      <AlertModal
        visible={modalState.type === 'journeyCompleted'}
        type="success"
        title="Journey Completado"
        message="El journey ha finalizado correctamente."
        confirmText="Aceptar"
        showCancelButton={false}
        onConfirm={closeModal}
      />

      {/* Modal: Error al completar */}
      <AlertModal
        visible={modalState.type === 'completeError'}
        type="danger"
        title="Error"
        message="No se pudo completar el journey. Intenta de nuevo."
        confirmText="Reintentar"
        cancelText="Cancelar"
        onConfirm={() => {
          closeModal();
          confirmCompleteJourney();
        }}
        onCancel={closeModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  /*
  debugLogoutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginTop: 20,
  },
  */
});
