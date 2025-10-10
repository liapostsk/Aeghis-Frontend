import api from "../client";
import { EmergencyContactDto } from "../types";


export const createEmergencyContact = async (emergencyContact: EmergencyContactDto): Promise<EmergencyContactDto> => {
  console.log("📡 API: Enviando contacto:", emergencyContact);
  const response = await api.post("/me/emergency-contact/add", emergencyContact);
  console.log("📡 API: Respuesta de creación:", response.data);
  return response.data;
};

export const editEmergencyContact = async (id: number, emergencyContact: EmergencyContactDto): Promise<void> => {
  await api.put(`/me/emergency-contact/${id}/edit`, emergencyContact);
};

export const deleteEmergencyContact = async (id: number): Promise<void> => {
  await api.delete(`/me/emergency-contact/${id}/delete`);
};