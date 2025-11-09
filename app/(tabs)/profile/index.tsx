import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/lib/storage/useUserStorage';
import { useAuth } from '@clerk/clerk-expo';
import ProfileHeader from '@/components/profile/ProfileHeader';
import SettingsSection from '@/components/profile/SettingsSection';
import EmergencyContactsSection from '@/components/profile/EmergencyContactsSection';
import SafeLocationsSection from '@/components/profile/SafeLocationsSection';
import { updateUserProfileOnLogout } from '@/api/firebase/users/userService';
import { unlinkFirebaseSession } from '@/api/firebase/auth/firebase';

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
    try {
      console.log('🚪 Iniciando logout...');
      
      // 1. Actualizar estado Firebase ANTES de cerrar sesión
      try {
        await updateUserProfileOnLogout();
        console.log('Usuario marcado como offline en Firebase');
      } catch (firebaseError) {
        console.warn('Error actualizando estado Firebase:', firebaseError);
      }

      // 2. Cerrar sesión de Firebase
      try {
        await unlinkFirebaseSession();
        console.log(' Sesión de Firebase cerrada');
      } catch (firebaseError) {
        console.warn('Error cerrando Firebase:', firebaseError);
      }

      // 3. Cerrar sesión de Clerk
      await signOut();
      console.log('Sesión de Clerk cerrada');

      // 4. Limpiar datos locales
      clearUser();
      
      // 5. Redirigir
      router.replace("/(auth)");
      
      console.log('Logout completado');

    } catch (error) {
      console.error('Error durante logout:', error);
      
      // Fallback: al menos cerrar Clerk y redirigir
      try {
        await signOut();
        clearUser();
        router.replace("/(auth)");
      } catch (fallbackError) {
        console.error('Error en fallback:', fallbackError);
      }
    }
  };

  if (!user) return null;

  const safeLocations = user.safeLocations ?? [
    { name: 'Casa', address: 'Calle Principal 123', type: 'Hogar', latitude: 40.4168, longitude: -3.7038 },
  ];


  return (
    
    <SafeAreaView style={styles.container}>

      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <ProfileHeader
            user={user}
            onToggleMenu={toggleMenu}
            onEdit={handleEditProfile}
          />
          <EmergencyContactsSection/>
          
          <SafeLocationsSection 
            locations={safeLocations}
          />
          <SettingsSection
            onDelete={handleDeleteAccount}
            onLogout={handleLogout}
          />
          <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f8ff',
  },
});
