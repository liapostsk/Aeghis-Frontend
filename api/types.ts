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
  emergencyContacts?: EmergencyContact[];
  externalContacts?: ExternalContact[];
};
  
export type ApiError = {
  code: string;
  message: string;
};

export interface Contact {
  phone: string;
  name?: string;
  relation?: string;
}

export type ContactStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "BLOCKED";

// Contacto de emergencia que es usuario
export interface EmergencyContactDto {
  id: number;
  ownerId: number;
  contactId: number;  // id del usuario contacto
  relation: string;
  status: ContactStatus;
}

export interface EmergencyContact {
  id: number;
  ownerId: number;
  contactId: number;  // id del usuario contacto
  relation: string;
  status: ContactStatus;
  name: string;       // nombre del contacto (no del usuario)
  phone: string;      // teléfono del contacto (no del usuario, normalizado E.164)
}

// Contacto de emergencia externo (no usuario)
export interface ExternalContact {
  id: number;
  name: string;
  phone: string;          // normalizado (E.164)
  relation: string;
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

export interface Group {
  id: number;
  name: string;
  description?: string;
  image?: string;
  type: typeof GROUP_TYPES[number];
  state: string;
  membersIds: number[]; // IDs de usuarios
  createdAt: Date;
  expirationDate?: Date;
  lastModified: Date;
  ownerId: number;
}

export interface Invitation {
  id: number;
  groupId: number;
  code: string;         // código único de invitación
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
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

export const GROUP_TYPES = [
  "CONFIANZA",
  "Temporals",
  "Companions",
] 

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
