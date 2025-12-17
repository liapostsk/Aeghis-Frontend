import api from "../client";
import { RegisterTokenDto, SendPushToUserRequest, EmergencyTriggerRequest } from './types';

/**
 * Registra el token en backend.
 */
export async function registerToken(userId: number, dto: RegisterTokenDto): Promise<void> {
  await api.post(`/api/notification-tokens/${userId}`, dto);  
  console.log('✅ [registerToken] Token registrado exitosamente en backend');
}

/**
 * Revoca un token del backend.
 */
export async function revokeToken(userId: number, token: string): Promise<void> {
  await api.delete(`/api/notification-tokens/${userId}/${encodeURIComponent(token)}`);
  
  console.log('✅ [revokeToken] Token revocado exitosamente');
}

/**
 * Envía una notificación push a un usuario
 */
export async function sendPushToUser(req: SendPushToUserRequest) {
  const payload = {
    userId: req.userId,
    title: req.title,
    body: req.body,
    data: req.data ?? {},
    channelId: req.channelId ?? 'default',
  };
  const { data } = await api.post('/api/push/sendToUser', payload);
  console.log(" information about sent notification: ", data);
  console.log("payload: ", data.payload);
  return data; // tickets, tokens, etc. según tu backend
}

/**
 * Dispara una alerta de emergencia que envía notificaciones a todos los contactos de emergencia aceptados
 */
export async function triggerEmergency(req: EmergencyTriggerRequest): Promise<void> {
  await api.post('/me/emergency-contact/trigger', req);
  console.log('✅ [triggerEmergency] Alerta de emergencia disparada exitosamente');
}
