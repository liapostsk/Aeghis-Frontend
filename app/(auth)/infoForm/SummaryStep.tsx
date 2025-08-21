import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '@/lib/storage/useUserStorage';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { mapUserToDto } from '@/api/user/mapper';
import { createUser } from '@/api/user/userApi';
import { Alert } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

const { width, height } = Dimensions.get('window');

export default function SummaryStep({onBack}: { onBack: () => void }) {

  const { user, setUser } = useUserStore();
  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  // Estado para controlar el loading y prevenir múltiples clics
  const [isLoading, setIsLoading] = useState(false);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Secuencia de animaciones de entrada
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Animación de pulso continua para el botón principal
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  const handleCreateUser = async () => {
    // Prevenir múltiples clics
    if (isLoading) {
      console.log('⚠️ Proceso ya en curso, ignorando clic adicional');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🚀 Iniciando creación de usuario...');
      
      if (!user) {
        Alert.alert("Error", "No hay datos de usuario disponibles.");
        return;
      }
      
      const token = await getToken();
      setToken(token);
      const dto = mapUserToDto(user);
      const userId = await createUser(dto);
      console.log("✅ User created with ID:", userId);
      
      // Step 4: Update local user state
      setUser({
        ...user,
        id: userId,
      });
      
      // Pequeña pausa para mostrar el estado de éxito antes de navegar
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 500);
      
    } catch (error: any) {
      console.error("❌ Failed to create user:", error);
      Alert.alert("Error", "No se pudo crear el usuario. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Elementos decorativos de fondo */}
      <View style={styles.backgroundDecor}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim }
            ]
          }
        ]}
      >
        {/* Icono de éxito */}
        <View style={styles.successIcon}>
          <Text style={styles.iconText}>🎉</Text>
        </View>

        {/* Título principal */}
        <Text style={styles.title}>¡Bienvenido a Aeghis!</Text>
        
        {/* Subtítulo */}
        <Text style={styles.subtitle}>
          Tu cuenta ha sido creada exitosamente
        </Text>

        {/* Descripción */}
        <Text style={styles.description}>
          Estás listo para comenzar a disfrutar de todas las funcionalidades que Aeghis tiene para ofrecerte.
        </Text>

        {/* Botones */}
        <View style={styles.buttonsContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable 
              style={[
                styles.primaryButton,
                isLoading && styles.primaryButtonDisabled
              ]} 
              onPress={handleCreateUser}
              disabled={isLoading}
              android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false }}
            >
              <Text style={[
                styles.primaryButtonText,
                isLoading && styles.primaryButtonTextDisabled
              ]}>
                {isLoading ? 'Creando cuenta...' : 'Comenzar Experiencia'}
              </Text>
              {!isLoading && <Text style={styles.buttonIcon}>→</Text>}
              {isLoading && (
                <View style={styles.loadingIndicator}>
                  <Text style={styles.loadingSpinner}>⏳</Text>
                </View>
              )}
            </Pressable>
          </Animated.View>

          <Pressable 
            style={[
              styles.secondaryButton,
              isLoading && styles.secondaryButtonDisabled
            ]} 
            onPress={onBack}
            disabled={isLoading}
            android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: false }}
          >
            <Text style={[
              styles.secondaryButtonText,
              isLoading && styles.secondaryButtonTextDisabled
            ]}>
              ← Volver Atrás
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    position: 'relative',
  },
  backgroundDecor: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 200,
    height: 200,
    top: -100,
    right: -100,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: -75,
    left: -75,
  },
  circle3: {
    width: 100,
    height: 100,
    top: height * 0.3,
    left: -50,
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconText: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  featuresList: {
    marginBottom: 40,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  primaryButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    shadowOpacity: 0.1,
  },
  primaryButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  primaryButtonTextDisabled: {
    color: 'rgba(102, 126, 234, 0.5)',
  },
  buttonIcon: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  loadingSpinner: {
    fontSize: 18,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
});