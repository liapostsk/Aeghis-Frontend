export type ChatType = 'direct' | 'group';

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