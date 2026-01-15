import api from "../../../client";
import { SafeLocation } from "../locationType";
import { calculateDistance } from "./googlePlacesApi";
import { formatDistance } from "./googlePlacesApi";

const DEFAULT_LOCATION_NAME = "Ubicación sin nombre";
const DEFAULT_DESCRIPTION = "Descripción no disponible";
const DEFAULT_ADDRESS = "Dirección no disponible";
const DEFAULT_TYPE = "custom";

export const getLocationFromCoordinates = async (
  latitude: number,
  longitude: number,
  name?: string,
  userLat?: number,
  userLng?: number
): Promise<SafeLocation | null> => {
  const response = await api.get("/geocode/reverse", {
    params: { lat: latitude, lng: longitude },
  });

  try {
    const data = response.data;

    if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const distanceInMeters =
        userLat && userLng ? calculateDistance(userLat, userLng, userLat, userLng) : undefined;
        return {
            name: name || result.formatted_address || DEFAULT_LOCATION_NAME,
            description: result.types ? result.types.join(", ") : DEFAULT_DESCRIPTION,
            address: result.formatted_address || DEFAULT_ADDRESS,
            type: result.types ? result.types.join(", ") : DEFAULT_TYPE,
            distance: distanceInMeters ? formatDistance(distanceInMeters) : undefined,
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
            externalId: result.place_id || result.id,
        };
    }
  } catch (error) {
    console.error("Error al procesar la respuesta de geocodificación:", error);
  }

  return null;
}

export const searchLocationsByText = async (
    query: string,
    userLat?: number,
    userLng?: number
): Promise<SafeLocation[]> => {
  const response = await api.get("/geocode/search", {
    params: { query },
  });

  try {
    const data = response.data;

    return (data.results || []).map((result: any) => ({
      name: result.formatted_address || DEFAULT_LOCATION_NAME,
      description: result.types ? result.types.join(", ") : DEFAULT_DESCRIPTION,
      address: result.formatted_address || DEFAULT_ADDRESS,
      type: result.types ? result.types.join(", ") : DEFAULT_TYPE,
      distance: userLat && userLng ? formatDistance(calculateDistance(userLat, userLng, result.geometry.location.lat, result.geometry.location.lng)) : undefined,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      externalId: result.place_id || result.id,
    }));
  } catch (error) {
    console.error("Error al procesar la respuesta de búsqueda por texto:", error);
  }

  return [];
}