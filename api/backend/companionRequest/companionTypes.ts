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
  creator: User;
  companion: User;
  companionGroup?: Group;
  trackingGroup?: Group;
  trayecto?: Journey;
}

export interface CompanionRequestDto {
  id: number;
  source: SafeLocation;
  destination: SafeLocation;
  state: RequestStatus;
  aproxHour?: Date;
  creationDate: Date;
  description?: string;
  creator: User;
  companionId: number;
  companionGroupId?: number;
  trackingGroupId?: number;
  trayectoId?: number;
}

export interface CreateCompanionRequestDto {
  sourceId: number;
  destinationId: number;
  aproxHour?: Date;
  description?: string;
}

export type RequestStatus = "CREATED" | "PENDING" | "MATCHED" | "IN_PROGRESS" | "FINISHED" | "DECLINED" | "CANCELLED";