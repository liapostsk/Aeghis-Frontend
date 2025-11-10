/**
 * api/notifications/index.ts
 * Exporta las funcionalidades principales de notificaciones
 */

// Re-exportar Context y hook
export { NotificationProvider, useNotification } from './NotificationContext';

// Re-exportar hook para enviar notificaciones
export { useNotificationSender } from '@/components/notifications/useNotificationSender';

// Re-exportar funciones de API directas
export { registerToken, revokeToken, sendPushToUser } from './notificationsApi';

// Re-exportar tipos
export type { 
  PlatformName, 
  RegisterTokenDto, 
  SendPushToUserRequest 
} from './types';
