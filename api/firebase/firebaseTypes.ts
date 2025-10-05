export type ChatType = 'direct' | 'group';

export interface ChatDoc {
  type: ChatType;
  name?: string;
  members: string[];
  admins: string[];
  ownerId: string;
  description?: string;
  lastMessage?: MessageDoc;
  lastMessageAt: any;   // Firebase Timestamp
  createdAt: any;       // Firebase Timestamp
}

export interface MessageDoc {
  id: string;
  senderId: string;
  read: boolean;
  type: 'text' | 'image';
  content: string;
  timestamp: any;       // Firebase Timestamp
}
