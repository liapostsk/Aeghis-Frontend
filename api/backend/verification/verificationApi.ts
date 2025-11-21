import api from '@/api/client';
import { ValidationStatus } from '@/lib/storage/useUserStorage';
import { UserDto } from '../types';

/**
 * Obtener todos los usuarios con estado PENDING (solo admin)
 */
export const getUsersPendingVerification = async (): Promise<UserDto[]> => {
  try {
    console.log('📋 Obteniendo usuarios pendientes de verificación...');
    const response = await api.get<UserDto[]>('/user/pending-verification');
    console.log(`✅ ${response.data.length} usuarios pendientes`);
    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo usuarios pendientes:', error);
    throw error;
  }
};

/**
 * Actualizar el estado de verificación de un usuario (solo admin)
 */
export const updateUserVerificationStatus = async (
  userId: number,
  status: ValidationStatus
): Promise<void> => {
  try {
    console.log(`🔄 Actualizando verificación del usuario ${userId} a ${status}...`);
    await api.patch(`/user/${userId}/verification`, { verify: status });
    console.log('✅ Estado de verificación actualizado');
  } catch (error) {
    console.error('❌ Error actualizando verificación:', error);
    throw error;
  }
};
