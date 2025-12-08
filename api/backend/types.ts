import { User } from "@/lib/storage/useUserStorage";
import { Group } from "./group/groupType";
import { SafeLocation } from "./locations/locationType";
import { Journey } from "./journeys/journeyType";

export enum ValidationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export type UserDto = {
  id: number;
  name: string;
  email: string;
  phone: string;
  image: string;
  verify: ValidationStatus;
  dateOfBirth: Date;
  acceptedPrivacyPolicy: boolean;
  safeLocations: SafeLocation[];
  emergencyContacts?: EmergencyContact[];
  externalContacts?: ExternalContact[];
  groups?: Group[];
  clerkId?: string;
  role: "USER" | "ADMIN";
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

export interface CompanionRequest {
  id: number;
  sourceId: number;
  destinationId: number;
  state: RequestStatus;
  creationDate: Date;
  description?: string;
  creator: User;
  companion: User;
  companionGroup?: Group;
  trackingGroup?: Group;
  trayecto?: Journey;
}

export interface CompanionRequestDto {
  id: number;
  sourceId: number;
  destinationId: number;
  state: RequestStatus;
  creationDate: Date;
  description?: string;
  creatorId: number;
  companionId: number;
  companionGroupId?: number;
  trackingGroupId?: number;
  trayectoId?: number;
}

export type RequestStatus = "CREATED" | "PENDING" | "MATCHED" | "IN_PROGRESS" | "FINISHED" | "DECLINED" | "CANCELLED";