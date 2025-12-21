
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
import { Participation } from '@/api/firebase/types';
import { Group } from '@/api/backend/group/groupType';
import { JourneyDto, JourneyStates } from '@/api/backend/journeys/journeyType';
import { changeJourneyStatus } from '@/api/backend/journeys/journeyApi';
import { updateJourneyState } from '@/api/firebase/journey/journeyService';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';

interface Participant extends Participation {
  id: string;
}

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
  const { t } = useTranslation();
  const [selectedGroupJourney, setSelectedGroupJourney] = useState<GroupWithJourney | null>(null);
  const [modalState, setModalState] = useState<ModalState>({ type: null });
  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  // --- USER LOCATION FOR EMERGENCY ---
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
      }
    })();
  }, []);

  // --- PARTICIPANTS LOGIC ---
  const chatId = selectedGroupJourney?.group.id ? selectedGroupJourney.group.id.toString() : undefined;
  const journeyId = selectedGroupJourney?.activeJourney?.id ? selectedGroupJourney.activeJourney.id.toString() : undefined;
  const journeyState = selectedGroupJourney?.activeJourney?.state;
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    if (chatId && journeyId) {
      getParticipants(chatId, journeyId).then(setParticipants);
    } else {
      setParticipants([]);
    }
  }, [chatId, journeyId]);

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
      
      if (!journey.id) {
        throw new Error('Journey ID no disponible');
      }
      
      const updatedJourneyData = {
        ...journey,
        state: JourneyStates.IN_PROGRESS,
        iniDate: new Date().toISOString(),
      };

      await changeJourneyStatus(journey.id, 'IN_PROGRESS');
      console.log('Journey iniciado en backend');
      
      await updateJourneyState(group.id.toString(), journey.id.toString(), 'IN_PROGRESS');

      setSelectedGroupJourney({
        ...selectedGroupJourney,
        activeJourney: updatedJourneyData
      });

      const message = journey.journeyType === 'INDIVIDUAL' 
        ? t('map.journeyStarted.locationSharing')
        : t('map.journeyStarted.participantsCanSee');
      
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

      if (!journey.id) {
        throw new Error('Journey ID no disponible');
      }

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
      <EmergencyButton 
        onPress={() => console.log('Emergencia procesada correctamente')} 
        userLocation={userLocation}
      />
      <JourneyOverlay 
        groupJourney={selectedGroupJourney}
        onStartJourney={handleStartJourney}
        onCompleteJourney={handleCompleteJourney}
      />

      {/* Modal: Journey ya está activo */}
      <AlertModal
        visible={modalState.type === 'journeyActive'}
        type="warning"
        title={t('map.journeyActive.title')}
        message={t('map.journeyActive.message')}
        confirmText={t('map.journeyActive.confirm')}
        showCancelButton={false}
        onConfirm={closeModal}
      />

      {/* Modal: Journey iniciado con éxito */}
      <AlertModal
        visible={modalState.type === 'journeyStarted'}
        type="success"
        title={t('map.journeyStarted.title')}
        message={`${t('map.journeyStarted.message')} ${modalState.message || ''}`}
        confirmText={t('map.journeyStarted.confirm')}
        showCancelButton={false}
        onConfirm={closeModal}
      />

      {/* Modal: Error al iniciar journey */}
      <AlertModal
        visible={modalState.type === 'journeyError'}
        type="danger"
        title={t('map.journeyError.title')}
        message={t('map.journeyError.message')}
        confirmText={t('map.journeyError.confirm')}
        cancelText={t('map.journeyError.cancel')}
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
        title={t('map.confirmComplete.title')}
        message={t('map.confirmComplete.message')}
        confirmText={t('map.confirmComplete.confirm')}
        cancelText={t('map.confirmComplete.cancel')}
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
        title={t('map.journeyCompleted.title')}
        message={t('map.journeyCompleted.message')}
        confirmText={t('map.journeyCompleted.confirm')}
        showCancelButton={false}
        onConfirm={closeModal}
      />

      {/* Modal: Error al completar */}
      <AlertModal
        visible={modalState.type === 'completeError'}
        type="danger"
        title={t('map.completeError.title')}
        message={t('map.completeError.message')}
        confirmText={t('map.completeError.confirm')}
        cancelText={t('map.completeError.cancel')}
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
