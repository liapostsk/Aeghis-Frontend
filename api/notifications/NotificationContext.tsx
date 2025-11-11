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
    console.log('👂 [usePushNotifications] Configurando listeners de notificaciones');

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
      console.log('🧹 [usePushNotifications] Removiendo listeners');
      notificationListener.current?.remove();
      responseListener.current?.remove();
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