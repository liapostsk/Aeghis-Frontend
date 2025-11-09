import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { usePushNotifications } from './usePushNotifications';
import { useUserStore } from '@/lib/storage/useUserStorage';

/**
 * Componente que SOLO escucha notificaciones.
 * El registro inicial se hace en SummaryStep después de crear el usuario.
 * ✅ autoRegister: false para evitar intentos de registro sin userId
 */
export function PushNotificationsInitializer() {
  const { isSignedIn } = useUser();
  const user = useUserStore((state) => state.user);
  const refreshUserFromBackend = useUserStore((state) => state.refreshUserFromBackend);
  
  const userId = user?.id;
  const mountedOnce = useRef(false);

  // Refrescar usuario cuando se autentica (solo una vez)
  useEffect(() => {
    if (mountedOnce.current) return;
    
    if (isSignedIn && !user) {
      console.log('🔄 [PushNotifications] Usuario autenticado, cargando desde backend...');
      refreshUserFromBackend();
    }
    
    mountedOnce.current = true;
  }, [isSignedIn, user, refreshUserFromBackend]);

  // ✅ autoRegister: false - Solo escuchar notificaciones, NO registrar automáticamente
  const { expoPushToken, permissionStatus } = usePushNotifications({
    userId,
    autoRegister: false,
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

  // Log estado solo cuando cambia
  useEffect(() => {
    if (userId && expoPushToken) {
      console.log('✅ [PushNotifications] Configuración completada', {
        userId,
        hasToken: !!expoPushToken,
        permissions: permissionStatus,
      });
    }
  }, [userId, expoPushToken, permissionStatus]);

  return null;
}
