export type ChatType = 'direct' | 'group';

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