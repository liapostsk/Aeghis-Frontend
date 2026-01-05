import { JourneyType, JourneyState } from '../backend/journeys/journeyType';
import { ParticipationState } from '../backend/participations/participationType';

export interface FirebaseUserProfile {
  lastSeen: any;
  isOnline: boolean;
  batteryLevel: number | null;
  displayName?: string;
}

export interface FirebaseUserProfileOptions {
  displayName?: string;
  photoURL?: string;
  batteryLevel?: number;
}

export interface BatteryInfo {
  level: number;
  timestamp: any;
}

export interface UserBatteryUpdate {
  batteryLevel: number;
  lastSeen: any;
}

export interface ChatDoc {
  members: string[];
  admins: string[];
  ownerId: string;
  lastMessage?: MessageDoc;
  lastMessageAt: any;
}

export interface MessageDoc {
  id: string;
  senderId: string;
  senderName: string;
  readBy: string[];
  content: string;
  timestamp: any;
}

export type GroupTileInfo = {
  chatId: string;
  lastMessage: string | null;
  lastMessageAt: any | null;
  lastSenderId: string | null;
  lastSenderName: string | null;
  unreadCount: number;
  membersCount: number;
};

export interface JourneyDoc {
  ownerId: string;
  type: JourneyType;
  state: JourneyState;
  startedAt: any;
  endedAt?: any;
}

export interface Participation {
  userId: string;
  journeyId?: string;
  state: ParticipationState;
  destination?: Position;
  backendParticipationId?: number | string;
  joinedAt: any;
  updatedAt: any;
}

export interface Position {
  latitude: number;
  longitude: number;
  timestamp: any;
}