export type UserDto = {
  id: number;
  name: string;
  email: string;
  phone: string;
  image: string;
  verify: boolean;
  dateOfBirth: Date;
  acceptedPrivacyPolicy: boolean;
  safeLocations: SafeLocation[];
  emergencyContacts: EmergencyContact[];
};
  
export type ApiError = {
  code: string;
  message: string;
};

export interface EmergencyContact { // Si el contacto es usuario, emergencyContactId es el id del usuario
  // Si no es usuario, se rellena la informacion solo de name y phone
  id?: number; // no se usa en el backend, solo para el frontend
  ownerId?: number;
  emergencyContactId?: number;
  name?: string;
  phone?: string;
  confirmed: boolean;
  relation?: string; // Relación con el usuario (padre, madre, amigo, etc.)
}
// Representación de un lugar (formato interno de tu app)
export interface SafeLocation {
  id?: number;
  name: string;
  description?: string;
  address: string;
  type: string; // tipo traducido o principal
  distance?: string; // ejemplo: "250 m" o "1.2 km"
  latitude: number;
  longitude: number;
  externalId?: string; // ID del lugar en la fuente externa (Google, etc.)
}

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
