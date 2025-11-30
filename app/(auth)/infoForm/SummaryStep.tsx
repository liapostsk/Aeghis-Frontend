import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Dimensions, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useUserStore } from '@/lib/storage/useUserStorage';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { mapUserToDto } from '@/api/backend/user/mapper';
import { createUser, getCurrentUser } from '@/api/backend/user/userApi';
import { linkFirebaseSession } from '@/api/firebase/auth/firebase';
import { ensureCurrentUserProfile } from '@/api/firebase/users/userService';
import { registerToken } from '@/api/notifications/notificationsApi';
import { useNotification } from '@/api/notifications/NotificationContext';
import { useSessionState } from '@/lib/hooks/useSessionState';

const { height } = Dimensions.get('window');

export default function SummaryStep({ onBack }: { onBack: () => void }) {
  const { user, setUser, clearUser } = useUserStore();
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const setToken = useTokenStore((state) => state.setToken);
  const { cleanupClerkUser } = useSessionState();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const { expoPushToken } = useNotification();

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
      
      // 2. Crear usuario en el backend CON las ubicaciones y contactos del formulario
      setLoadingMessage('Configurando tu perfil...');
      
      // Crear DTO con datos del formulario
      const baseDto = mapUserToDto(user);
      
      // Preparar datos para el backend (el DTO base ya incluye todo)
      // El backend se encargará de crear los IDs de ubicaciones y contactos
      console.log(" Creando usuario en backend...");
      console.log(" Ubicaciones del usuario:", user.safeLocations?.length || 0);
      console.log(" Contactos de emergencia:", user.emergencyContacts?.length || 0);
      console.log(" Contactos externos:", user.externalContacts?.length || 0);
      
      const userId = await createUser(baseDto as any); // Cast a any para evitar conflicto de tipos
      console.log(" Usuario creado con ID:", userId);
      
      // 3. Obtener datos actualizados del backend (ahora con IDs asignados)
      setLoadingMessage('Sincronizando datos...');
      const userData = await getCurrentUser();
      
      // 4. Actualizar estado local con todos los datos del backend
      setUser({
        ...user,
        id: userId,
        safeLocations: userData.safeLocations || [],
        emergencyContacts: userData.emergencyContacts || [],
        externalContacts: userData.externalContacts || [],
      });

      // 5. REGISTRAR NOTIFICACIONES PUSH (ahora que tenemos userId válido)
      if (expoPushToken) {
        try {
          setLoadingMessage('Configurando notificaciones...');
          console.log(" Registrando token de notificaciones en backend...");
          
          await registerToken(userId, {
            token: expoPushToken,
            platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
          });
          
          console.log("Token de notificaciones registrado exitosamente");
        } catch (pushError) {
          console.error("Error registrando token de notificaciones:", pushError);
          // No bloquear el registro - las notificaciones son opcionales
          console.warn(" Continuando sin notificaciones push");
        }
      } else {
        console.warn(" No hay token de notificaciones disponible (dispositivo virtual o permisos denegados)");
      }

      // 6. VINCULAR CON FIREBASE
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
        
        console.log("Sesión de Firebase vinculada exitosamente");
        
      } catch (firebaseError) {
        console.error("Error vinculando sesión de Firebase:", firebaseError);
        // No bloquear el acceso - Firebase es opcional para funcionalidades básicas
        console.warn("Continuando sin Firebase - Funcionalidades de chat limitadas");
      }

      // 7. Actualizar estado local con datos completos (incluyendo el rol del backend)
      setUser({
        ...user,
        id: userId,
        role: userData.role, // Incluir el rol asignado por el backend
        safeLocations: userData.safeLocations || [],
        emergencyContacts: userData.emergencyContacts || [],
        externalContacts: userData.externalContacts || [],
      });

      console.log("Usuario creado exitosamente");
      console.log("👤 Rol asignado por backend:", userData.role);

      // 8. Navegación final
      setLoadingMessage('¡Bienvenido a Aegis!');
      
      // Esperar más tiempo para que useSessionState detecte el cambio de rol
      await new Promise(resolve => setTimeout(resolve, 1200));
  
      
    } catch (error) {
      console.error("Error creando usuario en backend:", error);
      
      // ROLLBACK: Borrar usuario de Clerk para permitir reintentar
      let errorMessage = "No se pudo crear el usuario.";
      let shouldRollback = true;
      
      if (error?.response?.status === 409) {
        errorMessage = "Ya existe una cuenta con estos datos. Por favor, intenta iniciar sesión.";
        shouldRollback = true; // Borrar Clerk para liberar credenciales
      } else if (error?.response?.status === 401) {
        errorMessage = "Sesión inválida. Por favor, intenta registrarte nuevamente.";
        shouldRollback = true;
      } else if (error?.message?.includes('network') || error?.code === 'ECONNABORTED') {
        errorMessage = "Error de conexión. Verifica tu internet e intenta nuevamente.";
        shouldRollback = true;
      } else if (error?.response?.status >= 500) {
        errorMessage = "Error del servidor. Intenta más tarde.";
        shouldRollback = false; // No borrar Clerk por error del servidor
      }

      if (shouldRollback) {
        try {
          setLoadingMessage('Limpiando datos...');
          
          // Ejecutar rollback completo
          await cleanupClerkUser(`Error en backend: ${error?.response?.status || error?.message}`);
          
          // Limpiar estado local
          clearUser();
          setToken(null);
          
          Alert.alert(
            "Error de Registro",
            `${errorMessage}\n\nTus credenciales han sido liberadas. Puedes intentar registrarte nuevamente.`,
            [
              {
                text: "Volver al Registro",
                onPress: () => router.replace("/(auth)/register"),
              },
            ]
          );
          
        } catch (rollbackError) {
          console.error(" Error durante rollback:", rollbackError);
          Alert.alert(
            "Error Crítico",
            "No se pudo revertir el registro. Por favor, contacta soporte.",
            [
              {
                text: "Ir a Login",
                onPress: () => router.replace("/(auth)/login"),
              },
            ]
          );
        }
      } else {
        // Error temporal - mostrar mensaje sin rollback
        Alert.alert("Error Temporal", `${errorMessage}\n\nPor favor, intenta nuevamente en unos minutos.`);
      }
      
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