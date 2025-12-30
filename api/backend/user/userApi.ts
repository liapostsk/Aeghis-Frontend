import api from "../../client";
import { UserDto, ValidationStatus } from "../../backend/types";

export const getCurrentUser = async (): Promise<UserDto> => {
  console.log("📡 API: Llamando /user/me...");
  const response = await api.get("/user/me");
  return response.data;
};

export const createUser = async (dto: UserDto): Promise<number> => {
  const response = await api.post("/user", dto);
  return response.data;
};

export const getUser = async (id: number): Promise<UserDto> => {
  const response = await api.get(`/user/${id}`);
  return response.data;
};

export const updateUser = async (id: number, dto: UserDto): Promise<void> => {
  await api.put(`/user/${id}`, dto);
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/user/${id}`);
};

export const checkIfUserExists = async (phone: string): Promise<number | null> => {
  const response = await api.get(`/user/exists/${encodeURIComponent(phone)}`);
  return response.data;
};

export const addPhotoToUser = async (id: number, photoUrl: string): Promise<void> => {
  await api.post(`/user/${id}/photo`, photoUrl, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
};

export const getUsersPendingVerification = async (): Promise<UserDto[]> => {
  try {
    console.log('Obteniendo usuarios pendientes de verificación...');
    const response = await api.get<UserDto[]>('/user/unverified');
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
    await api.post(`/user/${userId}/verify?verified=${status}`);
    console.log('Estado de verificación actualizado');
  } catch (error) {
    console.log('Error actualizando verificación:', error);
    throw error;
  }
};