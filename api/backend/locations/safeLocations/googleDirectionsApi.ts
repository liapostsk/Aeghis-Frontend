import api from "../../../client";
import polyline from "@mapbox/polyline";

export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type RouteInfo = {
  coordinates: RouteCoordinate[];     // para pintar la Polyline
  distanceMeters: number;             // distancia total
  durationSeconds: number;            // duración total
  distanceText: string;               // "2.3 km"
  durationText: string;               // "15 mins"
};

/**
 * Obtiene la ruta (con polyline real) entre dos puntos usando tu backend /directions
 */
export const getRouteBetweenPoints = async (
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  mode: "walking" | "driving" | "bicycling" | "transit" = "walking"
): Promise<RouteInfo | null> => {
  try {
    const response = await api.get("/directions", {
      params: {
        originLat,
        originLng,
        destLat,
        destLng,
        mode,
      },
    });

    const data = response.data;
    console.log("🧭 Respuesta directions:", JSON.stringify(data, null, 2));

    if (!data.routes || data.routes.length === 0) {
      console.warn("No se encontró ruta");
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs?.[0];

    // 1) Decodificar polyline
    const points = polyline.decode(route.overview_polyline.points); // [[lat, lng], ...]
    const coordinates: RouteCoordinate[] = points.map(
      ([lat, lng]: [number, number]) => ({
        latitude: lat,
        longitude: lng,
      })
    );

    // 2) Distancia y duración
    const distanceMeters = leg?.distance?.value ?? 0;
    const durationSeconds = leg?.duration?.value ?? 0;

    const distanceText = leg?.distance?.text ?? "";
    const durationText = leg?.duration?.text ?? "";

    return {
      coordinates,
      distanceMeters,
      durationSeconds,
      distanceText,
      durationText,
    };
  } catch (error) {
    console.error("Error obteniendo ruta (directions):", error);
    return null;
  }
};
