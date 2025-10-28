// File: app/(tabs)/index.tsx
import { useUserStore } from '@/lib/storage/useUserStorage';
import { useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapHeader from '@/components/map/MapHeader';
import PeopleOnMap from '@/components/map/PeopleOnMap';
import JourneyOverlay from '@/components/map/JourneyOverlay';
import EmergencyButton from '@/components/map/EmergencyButton';
import { useState } from 'react';
import { Group } from '@/api/group/groupType';
import { JourneyDto } from '@/api/journeys/journeyType';

interface GroupWithJourney {
  group: Group;
  activeJourney: JourneyDto;
}

export default function MapScreen() {
  const { clearUser } = useUserStore();
  const { signOut } = useAuth();

  // ✅ Estado real conectado entre componentes
  const [selectedGroupJourney, setSelectedGroupJourney] = useState<GroupWithJourney | null>(null);


  const handleStartJourney = () => {
    console.log('Navegar a crear journey');
    router.push('/chat/journey');
  };

  /*
  <MapHeader activeGroup={activeGroup} />
      <GroupMap activeGroup={activeGroup} />
      <EmergencyButton />
      <JourneyOverlay activeGroup={activeGroup} />
  */

  /*
    <TouchableOpacity  onPress={handleLogout}>
      <Text>Cerrar sesión</Text>
    </TouchableOpacity>
  */

  return (
    <SafeAreaView style={styles.container}>
      
      {/* ✅ Header con funcionalidad completa */}
      <MapHeader 
        activeGroupJourney={selectedGroupJourney}
        onGroupJourneySelect={setSelectedGroupJourney}
      />
      
      <PeopleOnMap />
      
      <EmergencyButton onPress={() => console.log('Emergency triggered')} />
      
      {/* ✅ Overlay conectado con información real */}
      <JourneyOverlay 
        groupJourney={selectedGroupJourney}
        onStartJourney={handleStartJourney}
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
