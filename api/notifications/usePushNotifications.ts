import { useEffect, useRef, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { registerDeviceForPush } from './index';

type NotificationObj = Notifications.Notification | null;
type NotificationResponseObj = Notifications.NotificationResponse | null;

export type UsePushNotificationsOptions = {
  /** userId autenticado. Si no hay userId, no registra token */
  userId?: number;
  /** true por defecto: intenta registrar el token al montar */
  autoRegister?: boolean;
  /** callback cuando llega una notificación en foreground */
  onNotification?: (n: Notifications.Notification) => void;
  /** callback cuando el usuario interactúa con la notificación (abre/toca) */
  onResponse?: (r: Notifications.NotificationResponse) => void;
  /** channelId Android que usarás también desde el backend (default) */
  channelId?: string;
};

export function usePushNotifications(opts: UsePushNotificationsOptions = {}) {
  const {
    userId,
    autoRegister = true,
    onNotification,
    onResponse,
    channelId = 'default',
  } = opts;

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<NotificationObj>(null);
  const [lastResponse, setLastResponse] = useState<NotificationResponseObj>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<Notifications.PermissionStatus | 'unknown'>('unknown');

  const receiveListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // ---- Registro del token (puedes llamarlo manualmente si autoRegister=false)
  const register = useCallback(async () => {
    if (userId == null) {
      console.warn('⚠️ [usePushNotifications] No userId provided, skipping registration');
      return null;
    }

    try {
      console.log('🔄 [usePushNotifications] Registrando token para userId:', userId);
      const token = await registerDeviceForPush(userId);
      
      if (token) {
        console.log('✅ [usePushNotifications] Token obtenido:', token);
        setExpoPushToken(token);
      } else {
        console.warn('⚠️ [usePushNotifications] No se obtuvo token (probablemente emulador)');
      }
      
      // Actualiza permiso (útil para UI)
      const { status } = await Notifications.getPermissionsAsync();
      console.log('🔐 [usePushNotifications] Permission status:', status);
      setPermissionStatus(status);
      
      return token;
    } catch (err: any) {
      console.error('❌ [usePushNotifications] Error registrando token:', err);
      console.error('📋 [usePushNotifications] Error details:', {
        message: err.message,
        code: err.code,
        userId,
      });
      return null;
    }
  }, [userId]);

  // ---- Solicitar permisos explícitamente (útil si quieres un botón)
  const requestPermissions = useCallback(async () => {
    console.log('🔐 [usePushNotifications] Solicitando permisos de notificaciones...');
    const result = await Notifications.requestPermissionsAsync();
    console.log('🔐 [usePushNotifications] Permisos otorgados:', result.status);
    setPermissionStatus(result.status);
    return result.status;
  }, []);

  // ---- Helpers útiles
  const scheduleLocalNotification = useCallback(
    async (title: string, body: string, data: Record<string, any> = {}, seconds = 2) => {
      try {
        console.log('🔔 [usePushNotifications] Programando notificación local:', { title, seconds });
        await Notifications.scheduleNotificationAsync({
          content: { title, body, data },
          trigger: { seconds, channelId }, // channelId para Android
        });
        console.log('✅ [usePushNotifications] Notificación local programada');
      } catch (err) {
        console.error('❌ [usePushNotifications] Error programando notificación:', err);
        throw err;
      }
    },
    [channelId]
  );

  const cancelAllScheduled = useCallback(async () => {
    console.log('🗑️ [usePushNotifications] Cancelando todas las notificaciones programadas');
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ [usePushNotifications] Notificaciones canceladas');
  }, []);

  const clearBadge = useCallback(async () => {
    console.log('🔔 [usePushNotifications] Limpiando badge');
    await Notifications.setBadgeCountAsync(0);
    console.log('✅ [usePushNotifications] Badge limpiado');
  }, []);

  // ---- Efecto: registro automático si está habilitado
  useEffect(() => {
    let mounted = true;

    (async () => {
      console.log('🚀 [usePushNotifications] Inicializando...', { autoRegister, userId });
      
      // Lee estado de permisos al montar
      const { status } = await Notifications.getPermissionsAsync();
      console.log('🔐 [usePushNotifications] Estado inicial de permisos:', status);
      if (mounted) setPermissionStatus(status);

      if (autoRegister && userId != null) {
        try {
          console.log('🔄 [usePushNotifications] Auto-registro habilitado, registrando...');
          const token = await register();
          if (mounted) {
            setExpoPushToken(token);
            if (token) {
              console.log('✅ [usePushNotifications] Auto-registro exitoso');
            } else {
              console.warn('⚠️ [usePushNotifications] Auto-registro no obtuvo token');
            }
          }
        } catch (e) {
          console.error('❌ [usePushNotifications] Error en auto-registro:', e);
        }
      } else {
        console.log('ℹ️ [usePushNotifications] Auto-registro deshabilitado o sin userId');
      }
    })();

    return () => {
      mounted = false;
      console.log('🧹 [usePushNotifications] Componente desmontado');
    };
  }, [autoRegister, userId, register]);

  // ---- Efecto: listeners (recibida y respuesta)
  useEffect(() => {
    console.log('👂 [usePushNotifications] Configurando listeners de notificaciones');
    
    receiveListener.current = Notifications.addNotificationReceivedListener((n) => {
      console.log('🔔 [usePushNotifications] Notificación recibida:', n.request.identifier);
      console.log('📦 [usePushNotifications] Contenido:', {
        title: n.request.content.title,
        body: n.request.content.body,
        data: n.request.content.data,
      });
      setLastNotification(n);
      onNotification?.(n);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((r) => {
      console.log('👆 [usePushNotifications] Usuario interactuó con notificación:', r.notification.request.identifier);
      console.log('📦 [usePushNotifications] Data de respuesta:', r.notification.request.content.data);
      setLastResponse(r);
      onResponse?.(r);
    });

    return () => {
      console.log('🧹 [usePushNotifications] Removiendo listeners');
      receiveListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [onNotification, onResponse]);

  return {
    expoPushToken,
    permissionStatus,
    lastNotification,
    lastResponse,
    register,                // registrar ahora (si autoRegister=false o para reintentar)
    requestPermissions,      // pedir permisos explícitamente
    scheduleLocalNotification,
    cancelAllScheduled,
    clearBadge,
  };
}
