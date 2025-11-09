export type ChatType = 'direct' | 'group';
import { JourneyType, JourneyState } from '../backend/journeys/journeyType';
import { ParticipationState } from '../backend/participations/participationType';

// Firebase User Profile Types
export interface FirebaseUserProfile {
  displayName: string | null;
  photoURL: string | null;
  phone: string | null;
  createdAt: any;       // Firebase Timestamp
  lastSeen: any;        // Firebase Timestamp
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
  level: number;        // 0-100
  timestamp: any;       // Firebase Timestamp
}

export interface UserBatteryUpdate {
  batteryLevel: number;
  lastSeen: any;        // Firebase Timestamp
}

export interface ChatDoc {
  type: ChatType;
  members: string[];
  admins: string[];
  image?: string;
  ownerId: string;
  lastMessage?: MessageDoc;
  lastMessageAt: any;   // Firebase Timestamp
}

export interface MessageDoc {
  id: string;
  senderId: string;
  senderName: string;
  read: boolean;
  type: 'text' | 'image';
  content: string;
  timestamp: any;       // Firebase Timestamp
}

export type GroupTileInfo = {
  chatId: string;
  lastMessage: string | null;
  lastMessageAt: any | null;      // Timestamp
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
  startedAt: any;       // Firebase Timestamp
  endedAt?: any;        // Firebase Timestamp
}

export interface Participation {
  userId: string;
  journeyId?: string; // Opcional ya que está implícito en la ruta
  state: ParticipationState;
  destination?: Position;
  backendParticipationId?: number | string;
  joinedAt: any;      // Firebase Timestamp
  updatedAt: any;     // Firebase Timestamp
}

export interface Position {
  latitude: number;
  longitude: number;
  timestamp: any;       // Firebase Timestamp
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