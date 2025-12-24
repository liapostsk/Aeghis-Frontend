import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Dimensions, Alert, Platform, Image } from 'react-native';
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
import { useTranslation } from 'react-i18next';

const { height } = Dimensions.get('window');

export default function SummaryStep({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
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
      Alert.alert(t('infoForm.index.error'), t('infoForm.summary.errors.noUserData'));
      return;
    }

    setIsLoading(true);
    setLoadingMessage(t('infoForm.summary.loadingSteps.creatingAccount'));
    
    try {
      // 1. Obtener token de Clerk
      const token = await getToken();
      setToken(token);
      
      // 2. Crear usuario en el backend CON las ubicaciones y contactos del formulario
      setLoadingMessage(t('infoForm.summary.loadingSteps.configuringProfile'));
      
      // Crear DTO con datos del formulario
      const baseDto = mapUserToDto(user);
      
      // El backend se encargará de crear los IDs de ubicaciones y contactos
      console.log(" Creando usuario en backend...");
      console.log(" Ubicaciones del usuario:", user.safeLocations?.length || 0);
      console.log(" Contactos de emergencia:", user.emergencyContacts?.length || 0);
      console.log(" Contactos externos:", user.externalContacts?.length || 0);
      
      const userId = await createUser(baseDto as any);
      console.log(" Usuario creado con ID:", userId);
      
      setLoadingMessage(t('infoForm.summary.loadingSteps.syncing'));
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
          setLoadingMessage(t('infoForm.summary.loadingSteps.notifications'));
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
        setLoadingMessage(t('infoForm.summary.loadingSteps.realtime'));
        console.log("Vinculando sesión de Firebase...");
        await linkFirebaseSession();

        setLoadingMessage(t('infoForm.summary.loadingSteps.finalizing'));
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
      console.log("Rol asignado por backend:", userData.role);

      // 8. Navegación final
      setLoadingMessage(t('infoForm.summary.loadingSteps.welcome'));
      
      // Esperar más tiempo para que useSessionState detecte el cambio de rol
      await new Promise(resolve => setTimeout(resolve, 1200));
  
      
    } catch (error: any) {
      console.error("Error creando usuario en backend:", error);
      
      // ROLLBACK: Borrar usuario de Clerk para permitir reintentar
      let errorMessage = t('infoForm.summary.errors.noUserData');
      let shouldRollback = true;
      
      if (error?.response?.status === 409) {
        errorMessage = t('infoForm.summary.errors.conflict');
        shouldRollback = true; // Borrar Clerk para liberar credenciales
      } else if (error?.response?.status === 401) {
        errorMessage = t('infoForm.summary.errors.unauthorized');
        shouldRollback = true;
      } else if (error?.message?.includes('network') || error?.code === 'ECONNABORTED') {
        errorMessage = t('infoForm.summary.errors.network');
        shouldRollback = true;
      } else if (error?.response?.status >= 500) {
        errorMessage = t('infoForm.summary.errors.server');
        shouldRollback = false; // No borrar Clerk por error del servidor
      }

      if (shouldRollback) {
        try {
          setLoadingMessage(t('infoForm.summary.loadingSteps.finalizing'));
          
          // Ejecutar rollback completo
          await cleanupClerkUser(`Error en backend: ${error?.response?.status || error?.message}`);
          
          // Limpiar estado local
          clearUser();
          setToken(null);
          
          Alert.alert(
            t('infoForm.summary.errors.rollback.title'),
            t('infoForm.summary.errors.rollback.message', { error: errorMessage }),
            [
              {
                text: t('infoForm.summary.errors.rollback.button'),
                onPress: () => router.replace("/(auth)/register"),
              },
            ]
          );
          
        } catch (rollbackError) {
          console.error(" Error durante rollback:", rollbackError);
          Alert.alert(
            t('infoForm.summary.errors.critical.title'),
            t('infoForm.summary.errors.critical.message'),
            [
              {
                text: t('infoForm.summary.errors.critical.button'),
                onPress: () => router.replace("/(auth)/login"),
              },
            ]
          );
        }
      } else {
        // Error temporal - mostrar mensaje sin rollback
        Alert.alert(t('infoForm.summary.errors.temporary.title'), t('infoForm.summary.errors.temporary.message', { error: errorMessage }));
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
          <Image 
            source={require('@/assets/images/aegis.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>{t('infoForm.summary.title')}</Text>
        <Text style={styles.subtitle}>{t('infoForm.summary.subtitle')}</Text>
        <Text style={styles.description}>
          {t('infoForm.summary.description')}
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
                {isLoading ? t('infoForm.summary.buttons.loading') : t('infoForm.summary.buttons.start')}
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
              {t('infoForm.summary.buttons.back')}
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
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
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