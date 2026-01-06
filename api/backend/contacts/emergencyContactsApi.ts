import { EmergencyTriggerRequest } from "@/api/notifications/types";
import api from "../../client";
import { EmergencyContactDto } from "../types";


export const createEmergencyContact = async (emergencyContact: EmergencyContactDto): Promise<EmergencyContactDto> => {
  const response = await api.post("/emergency-contacts", emergencyContact);
  return response.data;
};

export const editEmergencyContact = async (id: number, emergencyContact: EmergencyContactDto): Promise<void> => {
  await api.put(`/emergency-contacts/${id}`, emergencyContact);
};

export const deleteEmergencyContact = async (id: number): Promise<void> => {
  await api.delete(`/emergency-contacts/${id}`);
};

export async function triggerEmergency(req: EmergencyTriggerRequest): Promise<void> {
  await api.post('/emergency-contacts/alert', req);
}