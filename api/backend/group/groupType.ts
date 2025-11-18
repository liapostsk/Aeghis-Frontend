
export interface Group {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  type: typeof GROUP_TYPES[number];
  state: string;
  membersIds: number[]; // IDs de usuarios
  adminsIds: number[];  // IDs de usuarios administradores
  createdAt: Date;
  expirationDate?: Date;
  lastModified: Date;
  ownerId: number;
}

export interface Invitation {
  id: number;
  groupId: number;
  code: string;         // código único de invitación
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
}

export const GROUP_TYPES = [
  "CONFIANZA",
  "Temporals",
  "Companions",
] 