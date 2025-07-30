import api from "../client";

export const getFirebaseCustomToken = async (uidClerk: string): Promise<string> => {
  try {
    const response = await api.post("/firebase/custom-token", {
      uidClerk,
    });

    return response.data; // El token de Firebase devuelto por tu backend
  } catch (error) {
    console.error("Error al obtener token personalizado de Firebase:", error);
    throw error;
  }
};
