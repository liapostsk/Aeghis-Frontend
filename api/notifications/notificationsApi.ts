import api from "@/api/client";
import { RegisterTokenDto, SendPushToUserRequest } from './types';

/**
 * Registra el token en backend.
 */
export async function registerToken(userId: number, dto: RegisterTokenDto): Promise<void> {
  await api.post(`/api/notification-tokens/${userId}`, dto);  
  console.log('[registerToken] Token registrado exitosamente en backend');
}

/**
 * Revoca un token del backend.
 */
export async function revokeToken(userId: number, token: string): Promise<void> {
  await api.delete(`/api/notification-tokens/${userId}/${encodeURIComponent(token)}`);
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
  return data;
}
