import api from "../client";
import { SafeLocation } from "../types";


export const createSafeLocation = async (safeLocation: SafeLocation): Promise<number> => {
  const response = await api.post("/me/safe-location/add", safeLocation);
  return response.data;
};

export const editSafeLocation = async (id: number, safeLocation: SafeLocation): Promise<void> => {
  await api.put(`/me/safe-location/${id}/edit`, safeLocation);
};

export const deleteSafeLocation = async (id: number): Promise<void> => {
  await api.delete(`/me/safe-location/${id}/delete`);
};