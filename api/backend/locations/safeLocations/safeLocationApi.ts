import api from "@/api/client";
import { SafeLocation } from "../locationType";

export const createSafeLocation = async (safeLocation: SafeLocation): Promise<number> => {
  const response = await api.post("/safe-location/", safeLocation);
  return response.data;
};

export const editSafeLocation = async (id: number, safeLocation: SafeLocation): Promise<void> => {
  await api.put(`/safe-location/${id}`, safeLocation);
};

export const deleteSafeLocation = async (id: number): Promise<void> => {
  try {
    await api.delete(`/safe-location/${id}`);
  } catch (error) {
    throw error;
  }
};