import { Group } from "./group/groupType";
import { SafeLocation } from "./locations/locationType";

export enum ValidationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  NO_REQUEST = 'NO_REQUEST'
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

export type ContactStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "BLOCKED";

export interface EmergencyContactDto {
  id: number;
  ownerId: number;
  contactId: number;
  relation: string;
  status: ContactStatus;
}

export interface EmergencyContact {
  id: number;
  ownerId: number;
  contactId: number;
  relation: string;
  status: ContactStatus;
  name: string;
  phone: string;
}

export interface ExternalContact {
  id: number;
  name: string;
  phone: string;
  relation: string;
}