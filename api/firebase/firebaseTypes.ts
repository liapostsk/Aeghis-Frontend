export type ChatType = 'direct' | 'group';
export type MemberRole = 'owner' | 'admin' | 'member';

export interface ParticipantInfo {
  role: MemberRole;
  joinedAt: any; // Firebase Timestamp
}

export interface ChatDoc {
  type: ChatType;
  name?: string;
  participants: Record<string, ParticipantInfo>;
  participantsArr: string[];
  lastMessage?: string;
  lastMessageAt: any;   // Firebase Timestamp
  createdAt: any;       // Firebase Timestamp
  createdBy: string;
}

export interface MessageDoc {
  senderId: string;
  type: 'text' | 'image';
  text?: string;
  mediaUrl?: string;
  timestamp: any;       // Firebase Timestamp
}
