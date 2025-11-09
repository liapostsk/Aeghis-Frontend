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
  
  // ✅ Guard para evitar registros simultáneos
  const busyRef = useRef(false);

  // ---- Registro del token con guards mejorados
  const register = useCallback(async () => {
    // ✅ Guard 1: Verificar userId válido
    if (!userId || userId <= 0) {
      console.warn('⚠️ [usePushNotifications] sin userId backend válido -> skip');
      return null;
    }

    // ✅ Guard 2: Evitar registros simultáneos
    if (busyRef.current) {
      console.warn('⚠️ [usePushNotifications] registro ya en curso -> skip');
      return null;
    }

    busyRef.current = true;

    try {
      console.log('🔄 [usePushNotifications] Registrando token para userId:', userId);

      // ✅ Guard 3: Verificar y solicitar permisos si es necesario
      let { status } = await Notifications.getPermissionsAsync();
      console.log('🔐 [usePushNotifications] Permission status actual:', status);
      
      if (status !== 'granted') {
        console.log('🔐 [usePushNotifications] Solicitando permisos...');
        const result = await Notifications.requestPermissionsAsync();
        status = result.status;
        console.log('🔐 [usePushNotifications] Permisos otorgados:', status);
      }
      
      if (status !== 'granted') {
        console.warn('⚠️ [usePushNotifications] permisos no concedidos -> skip');
        setPermissionStatus(status);
        return null;
      }

      setPermissionStatus(status);

      // ✅ Guard 4: Obtener token de Expo
      console.log('📱 [usePushNotifications] Obteniendo Expo Push Token...');
      const token = await registerDeviceForPush(userId);
      
      if (!token) {
        console.warn('⚠️ [usePushNotifications] no hay expo token (probablemente emulador) -> skip');
        return null;
      }

      console.log('✅ [usePushNotifications] Token obtenido y registrado:', token.substring(0, 30) + '...');
      setExpoPushToken(token);
      
      return token;
    } catch (err: any) {
      console.error('❌ [usePushNotifications] Error registrando token:', err);
      console.error('📋 [usePushNotifications] Error details:', {
        message: err.message,
        code: err.code,
        userId,
      });
      return null;
    } finally {
      busyRef.current = false;
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

  // ✅ Efecto: registro automático con guards mejorados
  useEffect(() => {
    let mounted = true;

    (async () => {
      console.log('🚀 [usePushNotifications] Inicializando...', { 
        autoRegister, 
        userId,
        hasValidUserId: userId && userId > 0,
      });

      // ✅ NO intentes registrar hasta tener userId backend real
      if (!autoRegister) {
        console.log('ℹ️ [usePushNotifications] Auto-registro deshabilitado');
        return;
      }

      if (!userId || userId <= 0) {
        console.log('⚠️ [usePushNotifications] Sin userId válido, esperando...');
        return;
      }

      try {
        console.log('🔄 [usePushNotifications] Auto-registro habilitado, iniciando...');
        const token = await register();
        
        if (mounted && token) {
          console.log('✅ [usePushNotifications] Auto-registro exitoso');
        } else if (mounted) {
          console.warn('⚠️ [usePushNotifications] Auto-registro completado pero sin token');
        }
      } catch (e) {
        console.error('❌ [usePushNotifications] Error en auto-registro:', e);
      }
    })();

    return () => {
      mounted = false;
      console.log('🧹 [usePushNotifications] Limpieza de efecto de registro');
    };
  }, [autoRegister, userId, register]);

  // ✅ Efecto: listeners (solo se montan una vez)
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
  }, [onNotification, onResponse]); // Solo depende de los callbacks

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
