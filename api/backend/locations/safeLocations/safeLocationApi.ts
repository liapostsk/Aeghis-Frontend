import api from "../../../client";
import { SafeLocation } from "../locationType";


export const createSafeLocation = async (safeLocation: SafeLocation): Promise<number> => {
  const response = await api.post("/me/safe-location/add", safeLocation);
  return response.data;
};

export const editSafeLocation = async (id: number, safeLocation: SafeLocation): Promise<void> => {
  await api.put(`/me/safe-location/${id}/edit`, safeLocation);
};

export const deleteSafeLocation = async (id: number): Promise<void> => {
  console.log("🌐 API: Eliminando ubicación con ID:", id);
  console.log("🌐 API: URL:", `/me/safe-location/${id}/delete`);
  
  try {
    const response = await api.delete(`/me/safe-location/${id}/delete`);
    console.log("✅ API: Respuesta del servidor:", response.status);
  } catch (error) {
    console.error("❌ API: Error en delete:", error);
    throw error;
  }
};