/**
 * api/notifications/notificationsApi.ts
 */

import api from "../client";
import { RegisterTokenDto, SendPushToUserRequest } from './types';

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
 * Opcional: si tienes el endpoint /api/push/sendToUser en backend
 * (el que construimos antes con ExpoPushService)
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
  return data; // tickets, tokens, etc. según tu backend
}
