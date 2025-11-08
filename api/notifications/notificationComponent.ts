import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { usePushNotifications } from './usePushNotifications';
import { useUserStore } from '@/lib/storage/useUserStorage';

/**
 * Componente que inicializa las notificaciones push.
 * Debe estar dentro del ClerkProvider para acceder a useUser().
 */
export function PushNotificationsInitializer() {
  const { isSignedIn } = useUser(); // Clerk para saber si está autenticado
  const user = useUserStore((state) => state.user); // Usuario desde storage
  const refreshUserFromBackend = useUserStore((state) => state.refreshUserFromBackend);
  
  // Obtener el userId numérico del usuario almacenado
  const userId = user?.id;

  // ✅ Refrescar usuario cuando se autentica
  useEffect(() => {
    if (isSignedIn && !user) {
      console.log('🔄 [PushNotifications] Usuario autenticado, cargando desde backend...');
      refreshUserFromBackend();
    }
  }, [isSignedIn, user, refreshUserFromBackend]);

  const { expoPushToken, permissionStatus } = usePushNotifications({
    userId,
    autoRegister: true,
    onNotification: (notification) => {
      const { title, body, data } = notification.request.content;
      console.log('🔔 [PushNotifications] Nueva notificación:', title);
      console.log('  📝 Body:', body);
      console.log('  📦 Data:', data);
    },
    onResponse: (response) => {
      const data = response.notification.request.content.data as any;
      console.log('👆 [PushNotifications] Usuario tocó notificación, data:', data);
      
      // Navegar según el tipo de notificación
      if (data?.type === 'chat_message' && data?.groupId) {
        console.log('📱 Navegando al chat:', data.groupId);
        router.push(`/chat?groupId=${data.groupId}`);
      } else if (data?.type === 'journey_alert' && data?.journeyId) {
        console.log('📱 Navegando al journey:', data.journeyId);
        router.push(`/chat/journey?journeyId=${data.journeyId}`);
      } else if (data?.screen) {
        console.log('📱 Navegando a screen:', data.screen);
        router.push(data.screen as any);
      }
    },
  });

  useEffect(() => {
    if (expoPushToken && userId) {
      console.log('✅ [PushNotifications] Push token registrado:', expoPushToken);
      console.log('  👤 UserId:', userId);
      console.log('  👤 Usuario:', user?.name);
      console.log('  🔐 Permisos:', permissionStatus);
    } else if (permissionStatus === 'denied') {
      console.warn('🚫 [PushNotifications] Permisos de notificaciones denegados');
    } else if (isSignedIn && !userId) {
      console.log('⏳ [PushNotifications] Esperando que se cargue el usuario...');
    } else if (userId && !expoPushToken) {
      console.log('⏳ [PushNotifications] Esperando token... (puede ser emulador)');
    }
  }, [expoPushToken, permissionStatus, userId, user, isSignedIn]);

  return null; // No renderiza nada visual
}
