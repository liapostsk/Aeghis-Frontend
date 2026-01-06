import api from "@/api/client";
import { ExternalContact } from "../types";


export const createExternalContact = async (externalContact: ExternalContact): Promise<number> => {
  try {
    console.log("API: Enviando contacto:", externalContact);
    const response = await api.post("/external-contacts", externalContact);
    console.log("API: Respuesta de creación:", response.data);
    return response.data;
  } catch (error) {
    console.error("API: Error en createExternalContact:", error);
    throw error;
  }
};

export const editExternalContact = async (id: number, externalContact: ExternalContact): Promise<void> => {
  try {
    await api.put(`/external-contacts/${id}`, externalContact);
  } catch (error) {
    console.error("API: Error en editExternalContact:", error);
    throw error;
  }
};

export const deleteExternalContact = async (id: number): Promise<void> => {
  try {
    console.log("API: Borrando contacto con ID:", id);
    await api.delete(`/external-contacts/${id}`);
  } catch (error) {
    console.error("API: Error en deleteExternalContact:", error);
    throw error;
  }
};