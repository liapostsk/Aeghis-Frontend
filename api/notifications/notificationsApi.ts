/**
 * api/notifications/notificationsApi.ts
 * ✅ CORREGIDO: Endpoints actualizados para enviar userId en el body
 */

import api from "../client";
import { RegisterTokenDto, SendPushToUserRequest } from './types';

/**
 * Registra el token en backend.
 * ✅ CORREGIDO: userId ahora va en el body, no en la URL
 */
export async function registerToken(userId: number, dto: RegisterTokenDto): Promise<void> {
  console.log('📤 [registerToken] Enviando a backend:', {
    userId,
    token: dto.token,
    platform: dto.platform,
  });
  
  // ✅ CORRECCIÓN: POST a /api/notification-tokens con userId en el body
  await api.post(
    '/api/notification-tokens',
    {
      userId,
      token: dto.token,
      platform: dto.platform,
    },
    {
      timeout: 30000, // 30s para cold starts
    }
  );
  
  console.log('✅ [registerToken] Token registrado exitosamente en backend');
}

/**
 * Revoca un token del backend.
 * ✅ CORREGIDO: userId y token van en el body, no en la URL
 */
export async function revokeToken(userId: number, token: string): Promise<void> {
  console.log('🗑️ [revokeToken] Revocando token:', { userId, token });
  
  // ✅ CORRECCIÓN: DELETE a /api/notification-tokens con userId y token en el body
  await api.delete('/api/notification-tokens', {
    data: {
      userId,
      token,
    },
    timeout: 15000,
  });
  
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
