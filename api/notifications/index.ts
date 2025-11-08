// api/notifications/index.ts
import { Platform } from 'react-native';
import type { PlatformName } from './types';
import { getExpoPushToken } from './expoConfig';
import { registerToken as registerTokenEndpoint, revokeToken as revokeTokenEndpoint } from './notificationsApi';

/**
 * Obtiene el token de Expo y lo registra en backend.
 * Devuelve el token (o null si no hay permisos/no es dispositivo real).
 */
export async function registerDeviceForPush(userId: number): Promise<string | null> {
  const token = await getExpoPushToken();
  if (!token) return null;

  const platform: PlatformName = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
  await registerTokenEndpoint(userId, { token, platform });
  return token;
}

/**
 * Revoca el token concreto en tu backend (p.ej. en logout).
 */
export async function revokeDevicePushToken(userId: number, token: string): Promise<void> {
  await revokeTokenEndpoint(userId, token);
}
