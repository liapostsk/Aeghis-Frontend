import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useUserStore } from '@/lib/storage/useUserStorage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { uploadVerificationSelfie, uploadVerificationDocument } from '@/api/firebase/storage/photoService';
import { useAuth } from '@clerk/clerk-expo';

interface ProfileVerificationScreenProps {
  onVerificationComplete: () => void;
  onSkip?: () => void;
  onBack?: () => void;
}

export default function ProfileVerificationScreen({
  onVerificationComplete,
  onSkip,
  onBack,
}: ProfileVerificationScreenProps) {
  const { user } = useUserStore();
  const { userId } = useAuth();
  
  const [profileImage, setProfileImage] = useState<string | null>(user?.image || null);
  const [livePhoto, setLivePhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Solicitar permisos de cámara
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tu cámara para verificar tu identidad.'
      );
      return false;
    }
    return true;
  };

  // Solicitar permisos de galería
  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tu galería para seleccionar tu foto de perfil.'
      );
      return false;
    }
    return true;
  };

  // Seleccionar foto de perfil desde galería o usar la existente
  const pickProfileImage = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Tomar foto en vivo con la cámara
  const takeLivePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front, // Cámara frontal para selfie
      });

      if (!result.canceled && result.assets[0]) {
        setLivePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  // Enviar verificación
  const handleSubmitVerification = async () => {
    if (!profileImage || !livePhoto) {
      Alert.alert(
        'Fotos incompletas',
        'Por favor, proporciona ambas fotos para continuar con la verificación.'
      );
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'No se pudo identificar al usuario');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Subiendo fotos de verificación a Firebase Storage...');
      
      // Subir ambas fotos a Firebase Storage
      const [documentUrl, selfieUrl] = await Promise.all([
        uploadVerificationDocument(profileImage, userId),
        uploadVerificationSelfie(livePhoto, userId),
      ]);

      console.log('Fotos subidas exitosamente:');
      console.log('Documento:', documentUrl);
      console.log('Selfie:', selfieUrl);

      Alert.alert(
        'Fotos enviadas',
        'Tus fotos han sido enviadas correctamente. Un administrador las revisará pronto.',
        [
          {
            text: 'Entendido',
            onPress: onVerificationComplete,
          },
        ]
      );
    } catch (error) {
      console.error('Error subiendo fotos de verificación:', error);
      Alert.alert(
        'Error',
        'No se pudieron subir las fotos. Por favor, intenta de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header con botón de volver */}
        {onBack && (
          <View style={styles.headerBar}>
            <Pressable style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </Pressable>
            <Text style={styles.headerBarTitle}>Verificación</Text>
            <View style={styles.headerBarSpacer} />
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={64} color="#7A33CC" />
        <Text style={styles.title}>Verificación de Perfil</Text>
        <Text style={styles.subtitle}>
          Para acceder a grupos de acompañamiento, necesitamos verificar tu identidad
        </Text>
      </View>

      {/* Instrucciones */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>¿Cómo funciona?</Text>
        <View style={styles.instructionItem}>
          <Ionicons name="image" size={20} color="#7A33CC" />
          <Text style={styles.instructionText}>
            1. Selecciona tu foto de perfil (o usa la actual)
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="camera" size={20} color="#7A33CC" />
          <Text style={styles.instructionText}>
            2. Toma una selfie en tiempo real
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="shield-checkmark" size={20} color="#7A33CC" />
          <Text style={styles.instructionText}>
            3. Nuestro sistema verificará que coincidan
          </Text>
        </View>
      </View>

      {/* Foto de perfil */}
      <View style={styles.photoSection}>
        <Text style={styles.sectionTitle}>
          1. Foto de perfil
        </Text>
        <Pressable
          style={[styles.photoCard, profileImage && styles.photoCardFilled]}
          onPress={pickProfileImage}
        >
          {profileImage ? (
            <>
              <Image source={{ uri: profileImage }} style={styles.photoPreview} />
              <Pressable style={styles.changeButton} onPress={pickProfileImage}>
                <Ionicons name="pencil" size={16} color="#FFF" />
                <Text style={styles.changeButtonText}>Cambiar</Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="image-outline" size={48} color="#9CA3AF" />
              <Text style={styles.photoPlaceholderText}>
                Seleccionar de galería
              </Text>
            </View>
          )}
        </Pressable>
        {profileImage && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.checkmarkText}>Foto seleccionada</Text>
          </View>
        )}
      </View>

      {/* Foto en vivo */}
      <View style={styles.photoSection}>
        <Text style={styles.sectionTitle}>
          2. Selfie en vivo
        </Text>
        <Pressable
          style={[styles.photoCard, livePhoto && styles.photoCardFilled]}
          onPress={takeLivePhoto}
        >
          {livePhoto ? (
            <>
              <Image source={{ uri: livePhoto }} style={styles.photoPreview} />
              <Pressable style={styles.changeButton} onPress={takeLivePhoto}>
                <Ionicons name="camera" size={16} color="#FFF" />
                <Text style={styles.changeButtonText}>Retomar</Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
              <Text style={styles.photoPlaceholderText}>
                Tomar selfie ahora
              </Text>
            </View>
          )}
        </Pressable>
        {livePhoto && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.checkmarkText}>Selfie capturada</Text>
          </View>
        )}
      </View>

      {/* Tips de seguridad */}
      <View style={styles.tipsCard}>
        <Ionicons name="information-circle" size={20} color="#FF9800" />
        <Text style={styles.tipsText}>
          Asegúrate de que tu rostro esté bien iluminado y visible en ambas fotos
        </Text>
      </View>

      {/* Botones de acción */}
      <View style={styles.actions}>
        <Pressable
          style={[
            styles.submitButton,
            (!profileImage || !livePhoto || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitVerification}
          disabled={!profileImage || !livePhoto || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color="#FFF" />
              <Text style={styles.submitButtonText}>Enviar Verificación</Text>
            </>
          )}
        </Pressable>
      </View>

      <Text style={styles.privacyNote}>
        🔒 Tus fotos se utilizan únicamente para verificación de identidad y se procesan de forma segura
      </Text>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerBarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerBarSpacer: {
    width: 40, // Mismo ancho que el botón para centrar el título
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  instructionsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  photoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  photoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    aspectRatio: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  photoCardFilled: {
    borderStyle: 'solid',
    borderColor: '#7A33CC',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  changeButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(122, 51, 204, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  checkmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  checkmarkText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  tipsText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  actions: {
    gap: 12,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#7A33CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  privacyNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});
