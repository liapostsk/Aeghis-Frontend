// src/api/chats.ts
import { auth, db } from '@/lib/firebase';
import {
  addDoc, collection, doc, serverTimestamp, setDoc,
} from 'firebase/firestore';
import type { ChatDoc, ParticipantInfo } from './firebaseTypes';

function buildParticipantsMap(
  entries: Array<{ uid: string; role: 'owner' | 'admin' | 'member' }>
): Record<string, ParticipantInfo> {
  const now = serverTimestamp() as any;
  return entries.reduce<Record<string, ParticipantInfo>>((acc, { uid, role }) => {
    acc[uid] = { role, joinedAt: now };
    return acc;
  }, {});
}

/**
 * Crea un chat DM. (Si quieres evitar duplicados, puedes antes buscar por una clave determinista o mantener un userChats).
 */
export async function createDirectChat(otherUid: string): Promise<string> {
  const myUid = auth.currentUser?.uid;
  if (!myUid) throw new Error('No hay sesión Firebase');

  const participants = buildParticipantsMap([
    { uid: myUid, role: 'member' },
    { uid: otherUid, role: 'member' },
  ]);

  const participantsArr = [myUid, otherUid].sort(); // útil para queries/índices

  const chat: Omit<ChatDoc, 'createdBy'> & { createdBy: string } = {
    type: 'direct',
    participants,
    participantsArr,
    createdAt: serverTimestamp(),
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    createdBy: myUid,
  };

  const ref = await addDoc(collection(db, 'chats'), chat);
  return ref.id;
}

export async function createGroupChat(name: string, memberUids: string[], ownerUid?: string): Promise<string> {
  const myUid = auth.currentUser?.uid;
  if (!myUid) throw new Error('No hay sesión Firebase');

  const owner = ownerUid ?? myUid;
  const unique = Array.from(new Set([owner, ...memberUids]));
  const participants = buildParticipantsMap(
    unique.map(uid => ({ uid, role: uid === owner ? 'owner' : 'member' }))
  );

  const participantsArr = [...unique].sort();

  const chat: ChatDoc = {
    type: 'group',
    name,
    participants,
    participantsArr,
    createdAt: serverTimestamp(),
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    createdBy: owner,
  };

  const ref = await addDoc(collection(db, 'chats'), chat);
  return ref.id;
}
