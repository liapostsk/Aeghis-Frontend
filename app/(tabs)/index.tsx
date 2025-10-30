import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
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

  // Estado real conectado entre componentes
  const [selectedGroupJourney, setSelectedGroupJourney] = useState<GroupWithJourney | null>(null);


  const handleStartJourney = () => {
    console.log('Navegar a crear journey');
    router.push('/chat/journey');
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
