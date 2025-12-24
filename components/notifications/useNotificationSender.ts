/**
 * Hook para enviar notificaciones push de forma sencilla
 */
import { useState } from 'react';
import { sendPushToUser } from '@/api/notifications/notificationsApi';
import type { SendPushToUserRequest } from '@/api/notifications/types';

interface SendNotificationParams {
  userId: number;
  title: string;
  body: string;
  data?: Record<string, any>;
  channelId?: string;
}

export function useNotificationSender() {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Envía una notificación push a un usuario
   */
  const sendNotification = async ({
    userId,
    title,
    body,
    data = {},
    channelId = 'default',
  }: SendNotificationParams): Promise<boolean> => {
    try {
      setIsSending(true);
      setError(null);

      console.log('📤 [useNotificationSender] Enviando notificación:', {
        userId,
        title,
        channelId,
      });

      const request: SendPushToUserRequest = {
        userId,
        title,
        body,
        data,
        channelId,
      };

      await sendPushToUser(request);

      console.log('[useNotificationSender] Notificación enviada exitosamente');
      return true;
    } catch (err: any) {
      const errorMessage = err?.message || 'Error enviando notificación';
      console.error('[useNotificationSender] Error:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Envía una notificación de bienvenida
   */
  const sendWelcomeNotification = async (userId: number) => {
    return sendNotification({
      userId,
      title: 'Bienvenido a Aeghis 🗺️',
      body: '¡Aegis está listo para protegerte! Tus notificaciones funcionan correctamente.',
      data: {
        type: 'welcome',
        screen: 'map',
        timestamp: Date.now(),
      },
      channelId: 'general',
    });
  };

  /**
   * Envía una notificación de mensaje de chat
   */
  const sendChatNotification = async (
    userId: number,
    groupId: string,
    senderName: string,
    message: string
  ) => {
    console.log('🔔 [useNotificationSender] Preparando notificación de chat para usuario:', userId);
    console.log('    Grupo ID:', groupId);
    console.log('    Remitente:', senderName);
    console.log('    Mensaje:', message);
    return sendNotification({
      userId,
      title: `💬 ${senderName}`,
      body: message,
      data: {
        type: 'chat_message',
        groupId,
        timestamp: Date.now(),
      },
      channelId: 'chat',
    });
  };

  /**
   * Envía una notificación de alerta de journey
   */
  const sendJourneyAlertNotification = async (
    userId: number,
    journeyId: string,
    alertType: string,
    message: string
  ) => {
    return sendNotification({
      userId,
      title: `🚨 Alerta de Journey`,
      body: message,
      data: {
        type: 'journey_alert',
        journeyId,
        alertType,
        timestamp: Date.now(),
      },
      channelId: 'alerts',
    });
  };

  /**
   * Envía una notificación de emergencia
   */
  const sendEmergencyNotification = async (
    userId: number,
    groupId: string,
    userName: string,
    location?: { lat: number; lng: number }
  ) => {
    return sendNotification({
      userId,
      title: `🆘 EMERGENCIA - ${userName}`,
      body: '¡Un miembro del grupo ha activado una alerta de emergencia!',
      data: {
        type: 'emergency',
        groupId,
        userName,
        location,
        timestamp: Date.now(),
      },
      channelId: 'emergency',
    });
  };

  /**
   * Envía una notificación de invitación a grupo
   */
  const sendGroupInviteNotification = async (
    userId: number,
    groupId: string,
    groupName: string,
    inviterName: string
  ) => {
    return sendNotification({
      userId,
      title: `📨 Invitación a grupo`,
      body: `${inviterName} te ha invitado a unirte a "${groupName}"`,
      data: {
        type: 'group_invite',
        groupId,
        groupName,
        inviterName,
        timestamp: Date.now(),
      },
      channelId: 'social',
    });
  };

  return {
    sendNotification,
    sendWelcomeNotification,
    sendChatNotification,
    sendJourneyAlertNotification,
    sendEmergencyNotification,
    sendGroupInviteNotification,
    isSending,
    error,
  };
}
