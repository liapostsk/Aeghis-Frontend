import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/lib/storage/useUserStorage';
import { useAuth } from '@clerk/clerk-expo';
import ProfileHeader from '@/components/profile/ProfileHeader';
import EmergencyContactsSection from '@/components/profile/EmergencyContactsSection';
import SafeLocationsSection from '../../components/profile/SafeLocationsSection';
import SettingsSection from '../(configuration)/SettingsSection';


export default function ProfileScreen() {
  const router = useRouter();
  const { user, clearUser } = useUserStore();
  const { signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [ editable, setEditable ] = useState(false);

  const toggleMenu = () => setShowMenu(!showMenu);
  const handleEditProfile = () => {
    setEditable(editable => !editable);
  };

  const handleDeleteAccount = () => {
    console.log('Eliminar cuenta');
  };

  const handleLogout = async () => {
    await signOut();
    clearUser();
    router.replace("/(initialScreen)");
  };

  if (!user) return null;

  const emergencyContacts = user.emergencyContacts ?? [
    { name: 'Carlos Rodríguez', relation: 'Hermano', phone: '+34 612 345 678', confirmed: true },
  ];

  const safeLocations = user.safeLocations ?? [
    { name: 'Casa', address: 'Calle Principal 123', type: 'Hogar', latitude: 40.4168, longitude: -3.7038 },
  ];

  // <StatusBar barStyle="dark-content" backgroundColor="#7A33CC" />

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#7A33CC" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ProfileHeader
          user={user}
          showMenu={showMenu}
          onToggleMenu={toggleMenu}
          onEdit={handleEditProfile}
          onLogout={handleLogout}
          onDelete={handleDeleteAccount}
        />

        <EmergencyContactsSection 
          contacts={emergencyContacts}
          editable={editable}
        />
        <SafeLocationsSection 
          locations={safeLocations}
          editable={editable}
        />
        <SettingsSection/>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7A33CC',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f8ff',
  },
});
