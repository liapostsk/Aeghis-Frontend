import api from "../../../client";
import { NearbySearchParams, SafeLocation, TextSearchParams } from "../locationType";

// Mapeo de tipos de Google Places a nombres en español
const TYPE_TRANSLATIONS: { [key: string]: string } = {
  hospital: "Hospital",
  police: "Comisaría",
  fire_station: "Bomberos",
  pharmacy: "Farmacia",
  gas_station: "Gasolinera",
  bank: "Banco",
  atm: "Cajero Automático",
  shopping_mall: "Centro Comercial",
  subway_station: "Estación de Metro",
  bus_station: "Estación de Autobús",
  university: "Universidad",
  school: "Escuela",
  library: "Biblioteca",
  gym: "Gimnasio",
  restaurant: "Restaurante",
  cafe: "Café",
  establishment: "Establecimiento",
  point_of_interest: "Punto de Interés",
};

// Cálculo de distancia Haversine
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1000); // metros
};

export const formatDistance = (meters: number): string =>
  meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`;

export const transformGooglePlaceToLocation = (
  place: any,
  userLat?: number,
  userLng?: number
): SafeLocation => {
  const lat = place.geometry.location.lat;
  const lng = place.geometry.location.lng;

  const distanceInMeters =
    userLat && userLng ? calculateDistance(userLat, userLng, lat, lng) : undefined;

  const type = place.types?.[0] || "establishment";
  const typeLabel = TYPE_TRANSLATIONS[type] || "Lugar";

  return {
    name: place.name,
    description: place.types?.length
      ? place.types.map((t: string) => TYPE_TRANSLATIONS[t] || t).join(", ")
      : "Lugar sin descripción",
    address: place.vicinity || place.formatted_address || "Dirección no disponible",
    type: typeLabel,
    distance: distanceInMeters ? formatDistance(distanceInMeters) : undefined,
    latitude: lat,
    longitude: lng,
    externalId: place.place_id || place.id,
  };
}

export const searchNearbyPlaces = async (
  params: NearbySearchParams
): Promise<SafeLocation[]> => {
  const { latitude, longitude, radius = 1500, types } = params;
  const type = types?.[0];

  const response = await api.get("/places/nearby", {
    params: { lat: latitude, lng: longitude, radius, type },
  });

  const data = response.data;
  return (data.results || []).map((place: any) =>
    transformGooglePlaceToLocation(place, latitude, longitude)
  );
};

export const searchPlacesByText = async (
  params: TextSearchParams
): Promise<SafeLocation[]> => {
  const { query, latitude, longitude, radius = 5000 } = params;

  const response = await api.get("/places/textsearch", {
    params: { query, lat: latitude, lng: longitude, radius },
  });

  const data = response.data;
  return (data.results || []).map((place: any) =>
    transformGooglePlaceToLocation(place, latitude, longitude)
  );
};

export const getPlaceDetails = async (
  placeId: string,
  userLat?: number,
  userLng?: number
): Promise<SafeLocation | null> => {
  const response = await api.get("/places/details", {
    params: { placeId },
  });

  const data = response.data;

  return data.result
    ? transformGooglePlaceToLocation(data.result, userLat, userLng)
    : null;
};
