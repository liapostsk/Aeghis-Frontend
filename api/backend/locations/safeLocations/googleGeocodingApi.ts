import api from "../../../client";
import { SafeLocation } from "../locationType";
import { calculateDistance } from "./googlePlacesApi";
import { formatDistance } from "./googlePlacesApi";

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
    console.log("🔍 Ubicación obtenida de coordenadas:", JSON.stringify(data, null, 2));

    if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const distanceInMeters =
        userLat && userLng ? calculateDistance(userLat, userLng, userLat, userLng) : undefined;
        return {
            name: name || result.formatted_address || "Ubicación sin nombre",
            description: result.types ? result.types.join(", ") : "Descripción no disponible",
            address: result.formatted_address || "Dirección no disponible",
            type: result.types ? result.types.join(", ") : "custom",
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
    console.log("🔍 Resultados de búsqueda por texto:", JSON.stringify(data, null, 2));

    return (data.results || []).map((result: any) => ({
      name: result.formatted_address || "Ubicación sin nombre",
      description: result.types ? result.types.join(", ") : "Descripción no disponible",
      address: result.formatted_address || "Dirección no disponible",
      type: result.types ? result.types.join(", ") : "custom",
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