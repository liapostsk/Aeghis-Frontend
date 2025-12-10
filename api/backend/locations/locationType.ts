export type Location = {
  id: number;
  name?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
};

export interface SafeLocation {
  id?: number;
  name: string;
  description?: string;
  address: string;
  type: string; // tipo traducido o principal
  distance?: string;
  latitude: number;
  longitude: number;
  externalId?: string; // ID del lugar en la fuente externa (Google, etc.)
}

// Tipo que puede ser cualquiera de los dos
export type SelectableLocation = SafeLocation | Location;

// Función helper para convertir Location a SafeLocation si es necesario
export const toSafeLocation = (location: SelectableLocation): SafeLocation => {
  if ('address' in location && 'type' in location) {
    // Ya es SafeLocation
    return location;
  }
  // Es Location, convertir a SafeLocation
  return {
    id: location.id,
    name: location.name || 'Ubicación personalizada',
    address: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
    type: 'custom',
    latitude: location.latitude,
    longitude: location.longitude,
    externalId: undefined
  };
};

// Parámetros para buscar lugares cercanos
export interface NearbySearchParams {
  latitude: number;
  longitude: number;
  radius?: number; // en metros, default 1500
  types?: string[]; // opcional: tipos de lugar (ej: hospital, cafe)
}

// Parámetros para búsqueda por texto
export interface TextSearchParams {
  query: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export const SAFE_LOCATION_TYPES = [
  "hospital",
  "police",
  "fire_station",
  "pharmacy",
  "gas_station",
  "bank",
  "atm",
  "shopping_mall",
  "subway_station",
  "bus_station",
  "university",
  "school",
  "library",
  "gym",
  "restaurant",
  "cafe",
] as const;

export type SafeLocationType = typeof SAFE_LOCATION_TYPES[number];