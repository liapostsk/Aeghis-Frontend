import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Dimensions, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useUserStore } from '@/lib/storage/useUserStorage';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { mapUserToDto } from '@/api/user/mapper';
import { createUser, getCurrentUser } from '@/api/user/userApi';
import { linkFirebaseSession } from '@/api/firebase/auth/firebase';
import { ensureCurrentUserProfile } from '@/api/firebase/users/userService';

const { height } = Dimensions.get('window');

export default function SummaryStep({ onBack }: { onBack: () => void }) {
  const { user, setUser } = useUserStore();
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const setToken = useTokenStore((state) => state.setToken);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Inicializar animaciones
  useEffect(() => {
    const animationConfig = { duration: 800, useNativeDriver: true };
    
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, ...animationConfig }),
        Animated.timing(scaleAnim, { toValue: 1, ...animationConfig }),
        Animated.timing(slideAnim, { toValue: 0, ...animationConfig }),
      ]),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ),
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim, pulseAnim]);

  // Crear usuario en el backend
  const handleCreateUser = async () => {
    if (isLoading) return;

    if (!user) {
      Alert.alert("Error", "No hay datos de usuario disponibles.");
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Creando tu cuenta...');
    
    try {
      // 1. Obtener token de Clerk
      const token = await getToken();
      setToken(token);
      
      // 2. Crear usuario en el backend
      setLoadingMessage('Configurando tu perfil...');
      const dto = mapUserToDto(user);
      const userId = await createUser(dto);
      
      // 3. Obtener datos actualizados del backend
      setLoadingMessage('Sincronizando datos...');
      const userData = await getCurrentUser();
      
      // 4. Actualizar estado local
      setUser({
        ...user,
        id: userId,
        emergencyContacts: userData.emergencyContacts,
        externalContacts: userData.externalContacts,
        safeLocations: userData.safeLocations,
      });

      // 5. VINCULAR CON FIREBASE
      try {
        setLoadingMessage('Configurando servicios en tiempo real...');
        console.log("Vinculando sesión de Firebase...");
        await linkFirebaseSession();

        setLoadingMessage('Finalizando configuración...');
        await ensureCurrentUserProfile({
          displayName: user?.name || undefined,
          photoURL: clerkUser?.imageUrl || undefined,
          phone: clerkUser?.phoneNumbers?.[0]?.phoneNumber || undefined,
        });
        
        console.log("✅ Sesión de Firebase vinculada exitosamente");
        
      } catch (firebaseError) {
        console.error("❌ Error vinculando sesión de Firebase:", firebaseError);
        // No bloquear el acceso - Firebase es opcional para funcionalidades básicas
        console.warn("⚠️ Continuando sin Firebase - Funcionalidades de chat limitadas");
      }

      // 6. Navegación final
      setLoadingMessage('¡Bienvenido a Aegis!');
      
      // Pequeña pausa para mostrar mensaje final
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1000);
      
    } catch (error) {
      console.error("❌ Error creando usuario:", error);
      
      // Mensajes de error más específicos
      let errorMessage = "No se pudo crear el usuario. Intenta de nuevo.";
      
      if (error?.response?.status === 409) {
        errorMessage = "Ya existe una cuenta con estos datos.";
      } else if (error?.message?.includes('network')) {
        errorMessage = "Error de conexión. Verifica tu internet.";
      } else if (error?.response?.status >= 500) {
        errorMessage = "Error del servidor. Intenta más tarde.";
      }
      
      Alert.alert("Error", errorMessage);
      
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
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

        <Text style={styles.title}>¡Bienvenido a Aegis!</Text>
        <Text style={styles.subtitle}>Tu cuenta ha sido creada exitosamente</Text>
        <Text style={styles.description}>
          Estás listo para comenzar a disfrutar de todas las funcionalidades que Aegis tiene para ofrecerte.
        </Text>

        {/* Mostrar mensaje de carga específico */}
        {isLoading && loadingMessage && (
          <View style={styles.loadingMessageContainer}>
            <Text style={styles.loadingMessage}>{loadingMessage}</Text>
          </View>
        )}

        {/* Botones */}
        <View style={styles.buttonsContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable 
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]} 
              onPress={handleCreateUser}
              disabled={isLoading}
            >
              <Text style={[styles.primaryButtonText, isLoading && styles.buttonTextDisabled]}>
                {isLoading ? 'Configurando...' : 'Comenzar Experiencia'}
              </Text>
              {!isLoading && <Text style={styles.buttonIcon}>→</Text>}
              {isLoading && <Text style={styles.loadingSpinner}>⏳</Text>}
            </Pressable>
          </Animated.View>

          <Pressable 
            style={[styles.secondaryButton, isLoading && styles.buttonDisabled]} 
            onPress={onBack}
            disabled={isLoading}
          >
            <Text style={[styles.secondaryButtonText, isLoading && styles.buttonTextDisabled]}>
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
  primaryButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonTextDisabled: {
    opacity: 0.5,
  },
  buttonIcon: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingSpinner: {
    fontSize: 18,
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Nuevos estilos para mensaje de carga
  loadingMessageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 20,
  },
  loadingMessage: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});