import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useUserStore } from '@/lib/storage/useUserStorage';
import { uploadUserPhotoAsync } from '@/api/firebase/storage/photoService';

export default function ProfileImageStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}){

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
      console.log('⚠️ Imagen detectada sin selección manual:', user.image);
      setUser({ ...user, image: '' });
    }
  }, []);

  const pickImageAsync = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need photo library permissions to select an image!');
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
        console.log('📤 Iniciando subida de imagen de perfil a Firebase...');
        setIsUploading(true);

        try {
          const downloadURL = await uploadUserPhotoAsync(
            localUri,
            user.idClerk!,
            'profile'
          );

          console.log('✅ Foto de perfil subida exitosamente');
          console.log('🔗 URL de descarga:', downloadURL);

          // Save the Firebase URL instead of local URI
          setUser({ ...user, image: downloadURL });
        } catch (uploadError) {
          console.error('❌ Error al subir la foto:', uploadError);
          Alert.alert('Error', 'No se pudo subir la foto. Por favor, intenta de nuevo.');
          setSelectedImageUri('');
        } finally {
          setIsUploading(false);
        }
      } else {
        console.log('Usuario canceló la selección de imagen');
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'Hubo un problema al seleccionar la imagen. Por favor, intenta de nuevo.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Add your profile photo</Text>
        <Text style={styles.text}>This helps your mutuals to find you{"\n"}easily in the map</Text>
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
              {selectedImageUri ? 'Change photo' : 'Add your photo'}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.buttonContainer}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Atrás</Text>
        </Pressable>
        
        <Pressable 
          onPress={onNext} 
          style={styles.continueButton}
        >
          <Text style={styles.continueButtonText}>Continuar</Text>
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
