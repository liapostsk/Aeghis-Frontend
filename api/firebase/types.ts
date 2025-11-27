export type ChatType = 'direct' | 'group';
import { JourneyType, JourneyState } from '../backend/journeys/journeyType';
import { ParticipationState } from '../backend/participations/participationType';

// Firebase User Profile Types
export interface FirebaseUserProfile {
  displayName: string | null;
  photoURL: string | null;
  phone: string | null;
  createdAt: any;
  lastSeen: any;
  isOnline: boolean;
  batteryLevel: number | null;
}

export interface FirebaseUserProfileUpdate {
  displayName?: string;
  photoURL?: string;
  phone?: string;
  batteryLevel?: number;
}

export interface FirebaseUserProfileOptions {
  displayName?: string;
  photoURL?: string;
  phone?: string;
  batteryLevel?: number;
}

// Tipos específicos para battery level
export interface BatteryInfo {
  level: number;
  timestamp: any;
}

export interface UserBatteryUpdate {
  batteryLevel: number;
  lastSeen: any;
}

export interface ChatDoc {
  type: ChatType;
  members: string[];
  admins: string[];
  image?: string;
  ownerId: string;
  lastMessage?: MessageDoc;
  lastMessageAt: any;
}

export interface MessageDoc {
  id: string;
  senderId: string;
  senderName: string;
  readBy: string[];
  type: 'text' | 'image';
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

// Firebase JOURNEY TYPES:

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

// Position Tile Info
export type PositionTileInfo = {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  lastUpdated: any;     // Timestamp
  isOnline: boolean;
};