// api/notifications/index.ts
import { Platform } from 'react-native';
import type { PlatformName } from './types';
import { getExpoPushToken } from './expoConfig';
import { registerToken as registerTokenEndpoint, revokeToken as revokeTokenEndpoint } from './notificationsApi';

/**
 * Obtiene el token de Expo y lo registra en backend.
 * ✅ CORREGIDO: Manejo de errores mejorado
 */
export async function registerDeviceForPush(userId: number): Promise<string | null> {
  try {
    console.log('🔔 [registerDeviceForPush] Iniciando registro para userId:', userId);
    
    // ✅ Obtener token de Expo
    const token = await getExpoPushToken();
    console.log('🔔 [registerDeviceForPush] Expo Push Token obtenido:', token ? 'OK' : 'NULL');
    
    if (!token) {
      console.warn('⚠️ [registerDeviceForPush] No se pudo obtener token de Expo');
      return null;
    }

    // ✅ Determinar plataforma
    const platform: PlatformName = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
    console.log('📱 [registerDeviceForPush] Plataforma:', platform);

    // ✅ Registrar en backend
    await registerTokenEndpoint(userId, { token, platform });
    
    console.log('✅ [registerDeviceForPush] Registro completado exitosamente');
    return token;
  } catch (error: any) {
    console.error('❌ [registerDeviceForPush] Error en registro:', {
      message: error.message,
      code: error.code,
      userId,
    });
    
    // ✅ No lanzar el error para no romper la app
    return null;
  }
}

/**
 * Revoca el token concreto en tu backend (p.ej. en logout).
 */
export async function revokeDevicePushToken(userId: number, token: string): Promise<void> {
  try {
    console.log('🗑️ [revokeDevicePushToken] Revocando token para userId:', userId);
    await revokeTokenEndpoint(userId, token);
    console.log('✅ [revokeDevicePushToken] Token revocado exitosamente');
  } catch (error: any) {
    console.error('❌ [revokeDevicePushToken] Error revocando token:', error);
    // No lanzar el error para no bloquear el logout
  }
}
