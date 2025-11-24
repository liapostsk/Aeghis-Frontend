import {
  View,
  Text,
  Image,
  StyleSheet,
  Platform,
  Pressable,
  ActionSheetIOS,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { User, ValidationStatus } from '@/lib/storage/useUserStorage';
import { uploadUserPhotoAsync, deleteUserPhoto } from '@/api/firebase/storage/photoService';
import { useState } from 'react';

interface profileHeaderProps {
  user: User;
  onToggleMenu: () => void;
  onEdit: () => void;
  onUpdateProfileImage: (imageUrl: string | null) => void;
}

export default function ProfileHeader({
  user,
  onEdit,
  onUpdateProfileImage,
}: profileHeaderProps) {

  const [isUploading, setIsUploading] = useState(false);

  // ✅ Log para ver la info del usuario
  console.log('👤 ProfileHeader - Usuario:', {
    id: user.id,
    name: user.name,
    email: user.email,
    verify: user.verify,
    verifyType: typeof user.verify,
    image: user.image ? 'Tiene imagen' : 'Sin imagen',
  });

  const showImageOptions = () => {
    const options = user.image 
      ? ['Change Photo', 'Delete Photo', 'Cancel']
      : ['Select Photo', 'Cancel'];
    
    const destructiveButtonIndex = user.image ? 1 : undefined;
    const cancelButtonIndex = user.image ? 2 : 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            // Change or Select Photo
            await handleChangePhoto();
          } else if (buttonIndex === 1 && user.image) {
            // Delete Photo
            await handleDeletePhoto();
          }
        }
      );
    } else {
      // Android: Show Alert
      if (user.image) {
        Alert.alert(
          'Profile Photo',
          'What would you like to do?',
          [
            { text: 'Change Photo', onPress: handleChangePhoto },
            { 
              text: 'Delete Photo', 
              onPress: handleDeletePhoto,
              style: 'destructive'
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else {
        handleChangePhoto();
      }
    }
  };

  const handleChangePhoto = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need access to your photos to change your profile picture.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setIsUploading(true);

        // Delete old photo if exists
        if (user.image) {
          try {
            await deleteUserPhoto(user.image);
          } catch (error) {
            console.warn('⚠️ No se pudo eliminar la foto anterior:', error);
          }
        }

        // Upload new photo
        const downloadURL = await uploadUserPhotoAsync(
          result.assets[0].uri,
          user.idClerk!,
          'profile'
        );

        onUpdateProfileImage(downloadURL);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not update profile photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUploading(true);

              if (user.image) {
                await deleteUserPhoto(user.image);
                console.log('🗑️ Foto de perfil eliminada');
              }

              onUpdateProfileImage(null);
            } catch (error) {
              console.error('❌ Error al eliminar foto:', error);
              Alert.alert('Error', 'Could not delete photo. Please try again.');
            } finally {
              setIsUploading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View>
      
      <View style={styles.profileCard}>
        <Pressable 
          style={styles.profileImageContainer}
          onPress={showImageOptions}
          disabled={isUploading}
        >
          <Image
            source={user.image ? { uri: user.image } : require('@/assets/images/aegis.png')}
            style={styles.profileImage}
          />
          {isUploading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#7A33CC" />
            </View>
          )}
          {user.verify === ValidationStatus.VERIFIED && (
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={24} color="#10B981" />
            </View>
          )}
          {/* Camera icon overlay */}
          <View style={styles.cameraIconOverlay}>
            <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
          </View>
        </Pressable>

        <Text style={styles.userName}>{user.name}</Text>
        <View style={styles.verifiedTextContainer}>
          {user.verify === ValidationStatus.VERIFIED ? (
            <>
              <MaterialIcons name="verified-user" size={18} color="#10B981" />
              <Text style={[styles.verifiedText, { color: '#10B981' }]}>Cuenta verificada</Text>
            </>
          ) : user.verify === ValidationStatus.REJECTED ? (
            <>
              <MaterialIcons name="cancel" size={18} color="#EF4444" />
              <Text style={[styles.verifiedText, { color: '#EF4444' }]}>Verificación rechazada</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="access-time" size={18} color="#F59E0B" />
              <Text style={[styles.verifiedText, { color: '#F59E0B' }]}>Pendiente de verificación</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#7A33CC',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  menuItemText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    margin: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#7A33CC',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 2,
    borderWidth: 2,
    borderColor: '#7A33CC',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  verifiedTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  verifiedText: {
    marginLeft: 5,
    color: '#3232C3',
    fontSize: 14,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: '#7A33CC',
    borderRadius: 15,
    padding: 5,
    borderWidth: 2,
    borderColor: 'white',
  },
});
