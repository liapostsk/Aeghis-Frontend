import api from "../client";
import { Location } from "./locationType";

/**
 * Obtiene una ubicación por su ID
 * GET /location/{id}
 */
export const getLocation = async (id: number): Promise<Location> => {
    const response = await api.get(`/location/${id}`);
    return response.data;
};

/**
 * Crea una nueva ubicación
 * POST /location
 */
export const createLocation = async (location: Location): Promise<number> => {
    const response = await api.post('/location', location);
    return response.data;
};

/**
 * Elimina una ubicación
 * DELETE /location
 */
export const deleteLocation = async (location: Location): Promise<void> => {
    await api.delete('/location', {
        data: location
    });
};