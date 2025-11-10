import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "@/utils/registerForPushNotificationsAsync";

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(
      (token) => setExpoPushToken(token),
      (error) => setError(error)
    );

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("🔔 Notification Received: ", notification);
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          "🔔 Notification Response: ",
          JSON.stringify(response, null, 2),
          JSON.stringify(response.notification.request.content.data, null, 2)
        );
        // Handle the notification response here
      });


    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ expoPushToken, notification, error }}>
      {children}
    </NotificationContext.Provider>
  );
};

/*
Navegación al hacer clic en una notificación (ejemplo):
responseListener.current =
  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as any;
    
    console.log("👆 [NotificationProvider] Usuario tocó notificación");
    console.log("  📦 Data:", data);

    // ✅ Navegar según el tipo de notificación
    if (data?.type === 'chat_message' && data?.groupId) {
      router.push(`/chat?groupId=${data.groupId}`);
    } else if (data?.type === 'journey_alert' && data?.journeyId) {
      router.push(`/chat/journey?journeyId=${data.journeyId}`);
    } else if (data?.type === 'sos' && data?.groupId) {
      router.push(`/chat?groupId=${data.groupId}`);
    } else if (data?.screen) {
      router.push(data.screen as any);
    }
  });
*/


/*

import React, { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { usePushNotifications } from './usePushNotifications';
import { useUserStore } from '@/lib/storage/useUserStorage';
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "@/utils/registerForPushNotificationsAsync";
import { Alert, Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// 1) Handler global: define cómo se muestran las notificaciones en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
  // Opcional: método para forzar registro manual si quieres
  register: () => Promise<string | null>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within a NotificationProvider');
  return ctx;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const mountedRef = useRef(false);

  // Crea canal Android "default" (si vas a usar channelId="default" desde el backend).
  // Recomendado por Expo para controlar importancia/sonido a partir de Android 8+. 
  // (Si no defines canal, Expo crea "Miscellaneous"). 
  const ensureAndroidChannel = async () => {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  };

  const resolveProjectId = (): string | null => {
    // Patrón recomendado por la doc
    // https://docs.expo.dev/versions/latest/sdk/notifications/#usage (ejemplo)
    const pid =
      // app.config extra
      (Constants?.expoConfig as any)?.extra?.eas?.projectId ??
      // EAS runtime
      (Constants as any)?.easConfig?.projectId ??
      null;
    return pid;
  };

  const register = async (): Promise<string | null> => {
    try {
      if (!Device.isDevice) {
        Alert.alert('Notificaciones', 'Necesitas un dispositivo físico para push.');
        return null;
      }

      await ensureAndroidChannel();

      // 1) Permisos
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        setError(new Error('Permisos de notificaciones no concedidos'));
        return null;
      }

      // 2) Token Expo (con projectId cuando sea necesario)
      const projectId = resolveProjectId();
      // La API permite pasar { projectId } y la doc lo ejemplifica así.
      // Es útil para evitar "No projectId found" en algunos entornos. 
      // https://docs.expo.dev/versions/latest/sdk/notifications/ (ejemplo) 
      const tokenObj = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : {}
      );
      const token = tokenObj.data;

      setExpoPushToken(token);
      return token;
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(String(e)));
      return null;
    }
  };

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    // Haz el registro automáticamente aquí si quieres,
    // o deja que cada pantalla llame a "register()" cuando corresponda.
    register();

    // 3) Listeners de eventos
    notificationListener.current = Notifications.addNotificationReceivedListener((n) => {
      setNotification(n);
    });

    // Manejo de respuestas (tap en notificación, también en cold start)
    const redirect = (n: Notifications.Notification) => {
      const url = (n.request.content.data as any)?.url;
      if (typeof url === 'string') {
        router.push(url);
      }
    };

    const last = Notifications.getLastNotificationResponse();
    if (last?.notification) {
      redirect(last.notification);
    }

    responseListener.current = Notifications.addNotificationResponseReceivedListener((resp) => {
      redirect(resp.notification);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
      mountedRef.current = false;
    };
  }, []);

  const value = useMemo(
    () => ({ expoPushToken, notification, error, register }),
    [expoPushToken, notification, error]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

*/