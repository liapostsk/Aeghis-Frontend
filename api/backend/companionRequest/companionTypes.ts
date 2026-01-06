import { User } from "@/lib/storage/useUserStorage";
import { Group } from "../group/groupType";
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
}

export interface CompanionRequestDto {
  id: number;
  source: SafeLocation;        // ojo: ver punto 2
  destination: SafeLocation;   // ojo: ver punto 2
  state: RequestStatus;
  aproxHour?: Date;
  creationDate: Date;
  description?: string;
  companionMessage: string;
  creator: User;
  companion: User;
  companionGroupId?: number;
}

export interface CreateCompanionRequestDto {
  sourceId: number;
  destinationId: number;
  aproxHour?: Date;
  description?: string;
}

export type RequestStatus = "CREATED" | "PENDING" | "MATCHED" | "IN_PROGRESS" | "FINISHED" | "EXPIRED" | "CANCELLED";