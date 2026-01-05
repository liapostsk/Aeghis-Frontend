import { User } from "@/lib/storage/useUserStorage";
import { Group } from "../group/groupType";
import { Journey } from "../journeys/journeyType";
import { SafeLocation } from "../locations/locationType";

export interface CompanionRequest {
  id: number;
  sourceId: number;
  destinationId: number;
  state: RequestStatus;
  creationDate: Date;
  description?: string;
  companionMessage: string;
  aproxHour?: Date;
  creator: User;
  companion: User;
  companionGroup?: Group;
  trackingGroup?: Group;
  trayecto?: Journey;
  // Grupos donde cada participante comparte su ubicación
  creatorTrackingGroup?: Group;
  companionTrackingGroup?: Group;
}

export interface CompanionRequestDto {
  id: number;
  source: SafeLocation;
  destination: SafeLocation;
  state: RequestStatus;
  aproxHour?: Date;
  creationDate: Date;
  description?: string;
  companionMessage: string;
  creator: User;
  companion: User;
  companionGroupId?: number;
  trackingGroupId?: number;
  trayectoId?: number;
  // IDs de los grupos donde cada participante comparte su ubicación
  creatorTrackingGroupId?: number;
  companionTrackingGroupId?: number;
}

export interface CreateCompanionRequestDto {
  sourceId: number;
  destinationId: number;
  aproxHour?: Date;
  description?: string;
}

export interface EditCompanionRequestDto {
  sourceId?: number;
  destinationId?: number;
  aproxHour?: Date;
  description?: string;
}

/*
export interface CompanionApplicant {
  userId: number;
  userName: string;
  userImage?: string;
  companionMessage: string;
  requestDate: Date;
}
*/

export type RequestStatus = "CREATED" | "PENDING" | "MATCHED" | "IN_PROGRESS" | "FINISHED" | "EXPIRED" | "CANCELLED";