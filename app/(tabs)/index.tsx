// File: app/(tabs)/debug.tsx
import { useUserStore } from '@/lib/storage/useUserStorage';
import { useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapHeader from '../../components/map/MapHeader';
import GroupMap from '../../components/map/GroupMap';
import JourneyOverlay from '../../components/map/JourneyOverlay';
import EmergencyButton from '../../components/map/EmergencyButton';
import { useEffect, useState } from 'react';

export default function MapScreen() {
  const { user, clearUser } = useUserStore();
  const { signOut } = useAuth();

  const [activeGroup, setActiveGroup] = useState<{ name: string } | null>(null);

  useEffect(() => {
    // Simulación de grupo activo
    setActiveGroup({ name: 'Return Safe Buddies' });
  }, []);

  /*
  <MapHeader activeGroup={activeGroup} />
      <GroupMap activeGroup={activeGroup} />
      <EmergencyButton />
      <JourneyOverlay activeGroup={activeGroup} />
  */

  return (
    <SafeAreaView style={styles.container}>
      <MapHeader activeGroup={activeGroup} />
      <GroupMap />
      <EmergencyButton onPress={() => console.log('Emergency triggered')} />
      <JourneyOverlay onStartJourney={function (): void {
        throw new Error('Function not implemented.');
      } } />
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
