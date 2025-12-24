import { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, StatusBar, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useUserStore } from '@/lib/storage/useUserStorage';
import { useAuth } from '@clerk/clerk-expo';
import ProfileHeader from '@/components/profile/ProfileHeader';
import SettingsSection from '@/components/profile/SettingsSection';
import EmergencyContactsSection from '@/components/profile/EmergencyContactsSection';
import SafeLocationsSection from '@/components/profile/SafeLocationsSection';
import VerificationBanner from '@/components/profile/VerificationBanner';
import ProfileVerificationScreen from '@/components/profile/ProfileVerificationScreen';
import { updateUserProfileOnLogout } from '@/api/firebase/users/userService';
import { unlinkFirebaseSession } from '@/api/firebase/auth/firebase';
import { addPhotoToUser } from '@/api/backend/user/userApi';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, clearUser, setUser, refreshUserFromBackend } = useUserStore();
  const { signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [editable, setEditable] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  useFocusEffect(
    useCallback(() => {
      const refreshUser = async () => {
        try {
          console.log(t('profile.refreshing'));
          const token = await getToken();
          setToken(token);
          await refreshUserFromBackend();
          console.log(t('profile.userUpdated'));
        } catch (error) {
          console.warn(t('profile.updateError'), error);
        }
      };

      refreshUser();
    }, [refreshUserFromBackend])
  );

  const toggleMenu = () => setShowMenu(!showMenu);
  const handleEditProfile = () => {
    setEditable(editable => !editable);
  };

  const handleUpdateProfileImage = async (imageUrl: string | null) => {
    try {
      if (!user?.id) {
        console.error('Usuario no disponible');
        return;
      }
      await addPhotoToUser(user.id, imageUrl || '');
      setUser({ ...user, image: imageUrl || '' });
      console.log('Imagen de perfil actualizada en el store:', imageUrl);
    } catch (error) {
      console.error('Error actualizando foto:', error);
    }
  };

  const handleDeleteAccount = () => {
    console.log('Eliminar cuenta');
  };

  const handleLogout = async () => {
    try {
      try {
        await updateUserProfileOnLogout();
      } catch (firebaseError) {
        console.warn('Error actualizando estado Firebase:', firebaseError);
      }

      // Cerrar sesión de Firebase
      try {
        await unlinkFirebaseSession();
        console.log(' Sesión de Firebase cerrada');
      } catch (firebaseError) {
        console.warn('Error cerrando Firebase:', firebaseError);
      }

      // Cerrar sesión de Clerk
      await signOut();
      console.log('Sesión de Clerk cerrada');

      // 4. Limpiar datos locales
      clearUser();
      
      router.replace("/(auth)");

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

  const handleOpenVerification = () => {
    setShowVerificationModal(true);
  };

  const handleCloseVerification = () => {
    setShowVerificationModal(false);
  };


  return (
    
    <SafeAreaView style={styles.container}>

      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <ProfileHeader
            user={user}
            onToggleMenu={toggleMenu}
            onEdit={handleEditProfile}
            onUpdateProfileImage={handleUpdateProfileImage}
          />
          
          <VerificationBanner onPress={handleOpenVerification} />
          
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

      {/* Modal de verificación */}
      <Modal
        visible={showVerificationModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <ProfileVerificationScreen
          onVerificationComplete={handleCloseVerification}
          onSkip={handleCloseVerification}
          onBack={handleCloseVerification}
        />
      </Modal>
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
