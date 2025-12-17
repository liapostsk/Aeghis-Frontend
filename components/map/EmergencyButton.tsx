import { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  Modal,
  Pressable,
  Vibration,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { triggerEmergency } from '@/api/notifications/notificationsApi';
import { useUserStore } from '@/lib/storage/useUserStorage';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';

interface EmergencyButtonProps {
  onPress: () => void;
  userLocation?: { lat: number; lng: number };
}

export default function EmergencyButton({ onPress, userLocation }: EmergencyButtonProps) {
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);

  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);
  
  const countdownIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Hook para datos del usuario
  const user = useUserStore((state) => state.user);

  // Manejar countdown
  useEffect(() => {
    if (showCountdown && countdown > 0) {
      // Vibración en cada segundo
      Vibration.vibrate(200);
      
      countdownIntervalRef.current = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (showCountdown && countdown === 0) {
      // Countdown terminado, activar emergencia
      handleEmergencyActivated();
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearTimeout(countdownIntervalRef.current);
      }
    };
  }, [showCountdown, countdown]);

  const handleEmergencyPress = () => {
    console.log('Botón de emergencia presionado');
    setShowCountdown(true);
    setCountdown(5);
  };

  const handleCancelCountdown = () => {
    console.log('Emergencia cancelada por el usuario');
    setShowCountdown(false);
    setCountdown(5);
    if (countdownIntervalRef.current) {
      clearTimeout(countdownIntervalRef.current);
    }
  };

  const handleEmergencyActivated = async () => {
    console.log('🚨🚨🚨 EMERGENCIA ACTIVADA 🚨🚨🚨');
    setIsProcessing(true);
    
    // Vibración fuerte
    Vibration.vibrate([0, 500, 200, 500]);

    try {
      // Verificar si hay contactos de emergencia
      const emergencyContacts = user?.emergencyContacts || [];
      
      if (emergencyContacts.length === 0) {
        setIsProcessing(false);
        setShowCountdown(false);
        Alert.alert(
          'Sin contactos de emergencia',
          'No tienes contactos de emergencia configurados. Por favor, agrega contactos en tu perfil.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('🚨 Disparando alerta de emergencia...');
      console.log('📍 Ubicación:', userLocation);

      const token = await getToken();
      setToken(token);

      // Disparar alerta de emergencia en el backend
      await triggerEmergency({
        latitude: userLocation?.lat,
        longitude: userLocation?.lng,
        message: 'Necesito ayuda urgente',
      });

      setShowCountdown(false);
      setIsProcessing(false);
      
      // Mostrar confirmación
      Alert.alert(
        'Alerta de Emergencia Enviada',
        'Tus contactos de emergencia han sido notificados con tu ubicación actual.',
        [
          { 
            text: 'OK',
            onPress: () => {
              onPress(); // Callback adicional si es necesario
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error activando emergencia:', error);
      setIsProcessing(false);
      setShowCountdown(false);
      
      Alert.alert(
        'Error',
        'No se pudo enviar la alerta de emergencia. Por favor, intenta de nuevo.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.emergencyButton} 
        onPress={handleEmergencyPress}
        activeOpacity={0.8}
      >
        <Text style={styles.emergencyText}>Emergency</Text>
        <Ionicons name="alert-circle" size={24} color="white" />
      </TouchableOpacity>

      {/* Modal de Countdown */}
      <Modal
        visible={showCountdown}
        transparent
        animationType="fade"
        onRequestClose={handleCancelCountdown}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.countdownContainer}>
            {isProcessing ? (
              <>
                <View style={styles.processingIconContainer}>
                  <Ionicons name="alert-circle" size={80} color="#EF4444" />
                </View>
                <Text style={styles.processingTitle}>Enviando Alerta...</Text>
                <Text style={styles.processingSubtitle}>
                  Notificando a tus contactos de emergencia
                </Text>
              </>
            ) : (
              <>
                <View style={styles.countdownCircle}>
                  <Text style={styles.countdownNumber}>{countdown}</Text>
                </View>
                
                <Text style={styles.countdownTitle}>
                  ⚠️ Alerta de Emergencia
                </Text>
                
                <Text style={styles.countdownDescription}>
                  Se enviará tu ubicación a tus contactos de emergencia en:
                </Text>

                <View style={styles.actionsContainer}>
                  <Pressable 
                    style={styles.cancelButton}
                    onPress={handleCancelCountdown}
                  >
                    <Ionicons name="close-circle" size={24} color="#FFF" />
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </Pressable>

                  <Pressable 
                    style={styles.sendNowButton}
                    onPress={() => {
                      setCountdown(0);
                    }}
                  >
                    <Ionicons name="send" size={24} color="#FFF" />
                    <Text style={styles.sendNowButtonText}>Enviar Ahora</Text>
                  </Pressable>
                </View>

                <Text style={styles.helpText}>
                  Presiona "Cancelar" si fue accidental
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  emergencyButton: {
    position: 'absolute',
    top: 130,
    left: 15,
    backgroundColor: '#6200ee',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    elevation: 5,
    gap: 10,
    minWidth: 150,
    justifyContent: 'center',
  },
  emergencyText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
  },
  countdownCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FEE2E2',
    borderWidth: 8,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  countdownNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: '#EF4444',
  },
  countdownTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  countdownDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6B7280',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sendNowButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  sendNowButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  processingIconContainer: {
    marginBottom: 20,
  },
  processingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  processingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
