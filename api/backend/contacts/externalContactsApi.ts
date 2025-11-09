import api from "../../client";
import { ExternalContact } from "../types";


export const createExternalContact = async (externalContact: ExternalContact): Promise<number> => {
  try {
    console.log("API: Enviando contacto:", externalContact);
    const response = await api.post("/me/external-contact/create", externalContact);
    console.log("API: Respuesta de creación:", response.data);
    return response.data;
  } catch (error) {
    console.error("API: Error en createExternalContact:", error);
    throw error;
  }
};

export const editExternalContact = async (id: number, externalContact: ExternalContact): Promise<void> => {
  try {
    await api.put(`/me/external-contact/${id}/edit`, externalContact);
  } catch (error) {
    console.error("API: Error en editExternalContact:", error);
    throw error;
  }
};

export const deleteExternalContact = async (id: number): Promise<void> => {
  try {
    console.log("API: Borrando contacto con ID:", id);
    await api.delete(`/me/external-contact/${id}/delete`);
  } catch (error) {
    console.error("API: Error en deleteExternalContact:", error);
    throw error;
  }
};