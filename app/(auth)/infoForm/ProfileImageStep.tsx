import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '@clerk/clerk-expo';
import { useUserStore } from '@/lib/storage/useUserStorage';
import { uploadUserPhotoAsync } from '@/api/firebase/storage/photoService';
import { useTranslation } from 'react-i18next';

export default function ProfileImageStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}){

  const { t } = useTranslation();
  const { user: clerkUser } = useUser();
  const { user, setUser } = useUserStore();
  const [selectedImageUri, setSelectedImageUri] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Limpiar el campo image al montar el componente
  useEffect(() => {
    if (user?.image && user.image !== '') {
      console.log('Limpiando imagen previa:', user.image);
      setUser({ ...user, image: '' });
    }
  }, []);

  useEffect(() => {
    console.log('ProfileImageStep montado. Estado actual de user.image:', user?.image);
    
    if (user?.image && user.image !== '') {
      console.log('Imagen detectada sin selección manual:', user.image);
      setUser({ ...user, image: '' });
    }
  }, []);

  const pickImageAsync = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('infoForm.profileImage.permissions.title'), t('infoForm.profileImage.permissions.message'));
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets?.[0]) {
        const localUri = result.assets[0].uri;
        setSelectedImageUri(localUri);
        
        // Upload to Firebase Storage
        console.log('Iniciando subida de imagen de perfil a Firebase...');
        setIsUploading(true);

        try {
          // Verificar que tenemos el UID de Clerk
          if (!clerkUser?.id) {
            throw new Error('No se pudo obtener el ID del usuario de Clerk');
          }

          // Subir usando el UID de Clerk
          const downloadURL = await uploadUserPhotoAsync(
            localUri,
            clerkUser.id,
            'profile'
          );

          console.log('Foto de perfil subida exitosamente');
          console.log('URL de descarga:', downloadURL);

          // Save the Firebase URL instead of local URI
          setUser({ ...user, image: downloadURL });
        } catch (uploadError) {
          console.error('Error al subir la foto:', uploadError);
          Alert.alert(t('infoForm.index.error'), t('infoForm.profileImage.errors.upload'));
          setSelectedImageUri('');
        } finally {
          setIsUploading(false);
        }
      } else {
        console.log('Usuario canceló la selección de imagen');
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert(t('infoForm.index.error'), t('infoForm.profileImage.errors.selection'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{t('infoForm.profileImage.title')}</Text>
      </View>

      <View style={styles.imageContainer}>
        {selectedImageUri ? (
          <Image
            source={{ uri: selectedImageUri }}
            style={styles.image}
          />
        ) : (
          <Image
            source={require("@/assets/images/addPicture.png")}
            style={styles.image}
          />
        )}

        <Pressable
          onPress={pickImageAsync}
          style={styles.addPictureButton}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#7A33CC" size="small" />
          ) : (
            <Text style={styles.addPictureText}>
              {selectedImageUri ? t('infoForm.profileImage.buttons.change') : t('infoForm.profileImage.buttons.add')}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.buttonContainer}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>{t('infoForm.profileImage.buttons.back')}</Text>
        </Pressable>
        
        <Pressable 
          onPress={onNext} 
          style={styles.continueButton}
        >
          <Text style={styles.continueButtonText}>{t('infoForm.profileImage.buttons.continue')}</Text>
        </Pressable>
      </View>
  
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    bottom: "20%",
    textAlign: 'center',
  },
  imageContainer: {
    width: width * 0.8,
    height: width * 0.8,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    bottom: "8%",
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  text: {
    fontSize: 19,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.1,
    backgroundColor: '#FFFFFF',
    marginBottom: 35,
  },
  addPictureButton: {
    backgroundColor: 'yellow',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    width: 250,
    height: 47,
  },
  addPictureText: {
    color: '#7A33CC',
    fontSize: 20,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  continueButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(122, 51, 204, 0.3)',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    top: "15%",
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
});
