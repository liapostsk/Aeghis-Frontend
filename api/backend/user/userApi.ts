import api from "@/api/client";
import { UserDto, ValidationStatus } from "@/api/backend/types";

export const getCurrentUser = async (): Promise<UserDto> => {
  try {
    console.log("API: Llamando /users/me...");
    const response = await api.get("/users/me");
    return response.data;
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error);
    throw error;
  }
};

export const createUser = async (dto: UserDto): Promise<number> => {
  try {
    const response = await api.post("/users", dto);
    return response.data;
  } catch (error) {
    console.error('Error creando usuario:', error);
    throw error;
  }
};

export const getUser = async (id: number): Promise<UserDto> => {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo usuario ${id}:`, error);
    throw error;
  }
};

export const getUserByClerkId = async (clerkId: string): Promise<UserDto> => {
  try {
    const response = await api.get(`/users/clerk/${clerkId}`);
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo usuario por ClerkId ${clerkId}:`, error);
    throw error;
  }
};

export const updateUser = async (id: number, dto: UserDto): Promise<void> => {
  try {
    await api.put(`/users/${id}`, dto);
  } catch (error) {
    console.error(`Error actualizando usuario ${id}:`, error);
    throw error;
  }
};

export const deleteUser = async (id: number): Promise<void> => {
  try {
    await api.delete(`/users/${id}`);
  } catch (error) {
    console.error(`Error eliminando usuario ${id}:`, error);
    throw error;
  }
};

export const checkIfUserExists = async (phone: string): Promise<number | null> => {
  try {
    const response = await api.get(`/users/exists/${encodeURIComponent(phone)}`);
    return response.data;
  } catch (error) {
    console.error(`Error verificando existencia de usuario con teléfono ${phone}:`, error);
    throw error;
  }
};

export const addPhotoToUser = async (id: number, photoUrl: string): Promise<void> => {
  try {
    await api.post(`/users/${id}/photo`, photoUrl, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error(`Error añadiendo foto al usuario ${id}:`, error);
    throw error;
  }
};

export const getUsersPendingVerification = async (): Promise<UserDto[]> => {
  try {
    console.log('Obteniendo usuarios pendientes de verificación...');
    const response = await api.get<UserDto[]>('/users/unverified');
    console.log(`${response.data.length} usuarios pendientes`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo usuarios pendientes:', error);
    throw error;
  }
};

export const updateUserVerificationStatus = async (
  userId: number,
  status: ValidationStatus
): Promise<void> => {
  try {
    console.log(`Actualizando verificación del usuario ${userId} a ${status}...`);
    await api.post(`/users/${userId}/verify?verified=${status}`);
    console.log('Estado de verificación actualizado');
  } catch (error) {
    console.log('Error actualizando verificación:', error);
    throw error;
  }
};