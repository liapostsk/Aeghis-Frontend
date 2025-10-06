// Code for Firestore chat service
import { auth, db } from '@/firebaseconfig';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Unsubscribe,
  arrayUnion,
  writeBatch,
  limit,
} from 'firebase/firestore';
import type { ChatDoc, MessageDoc } from '../firebaseTypes';
import { Group } from '@/api/types';

/**
 * Asegura que hay sesión de Firebase y devuelve el uid.
 * Lanza error si no hay sesión (enlaza Clerk→Firebase antes de usar el servicio).
 */
function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('No Firebase session. Call linkFirebaseSessionOnce() after Clerk login.');
  return uid;
}

// Creación de chats en Firestore
export async function createGroupFirebase(group: Partial<Group>): Promise<string> {
  const ownerUid = requireUid();

  const chatRef = doc(db, 'chats', String(group.id));
  const now = serverTimestamp();

  const payload: ChatDoc = {
    name: group.name || 'Group Chat',
    type: 'group',
    admins: ownerUid ? [ownerUid] : [],
    members: ownerUid ? [ownerUid] : [],
    ownerId: ownerUid || '',
    description: group.description || '',
    createdAt: now,
    lastMessage: null as unknown as MessageDoc,
    lastMessageAt: "",
  };

  await setDoc(chatRef, payload, { merge: true });
  return chatRef.id;
}

export async function joinGroupChatFirebase(groupId: string) {
  const uid = requireUid();
  const chatRef = doc(db, 'chats', String(groupId));

  try {
    await updateDoc(chatRef, {
      members: arrayUnion(uid),
      updatedAt: serverTimestamp(),
    });
    // ahora que YA eres miembro, si quieres, pon el listener:
    // const snap = await getDoc(chatRef); // <- si lo necesitas, ahora sí
  } catch (e: any) {
    console.log('Join failed:', e.code, e.message);
    throw e;
  }
}

//Update group chat participants when members are added/removed in backend
export async function updateGroupFirebase(group: Group) {
  const chatRef = doc(db, 'chats', String(group.id));

  await setDoc(chatRef, {
    groupName: group.name,
    admins: group.adminsIds || [],
    members: group.membersIds || [],
    description: group.description || '',
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// FUNCIONES DE MENSAJERÍA

// sendMessageToGroup, como ahora ya somos miembros, podemos enviar mensajes
export async function sendMessageFirebase(groupId: string, text: string) {
  const uid = requireUid();
  const trimmed = text.trim();
  if (!trimmed) return;

  const chatRef = doc(db, 'chats', groupId);
  const messagesRef = collection(db, 'chats', groupId, 'messages');
  const newMsgRef = doc(messagesRef); // generas ID primero

  const batch = writeBatch(db);
  batch.set(newMsgRef, {
    senderId: uid,
    type: 'text',
    content: trimmed,
    read: false,
    timestamp: serverTimestamp(),
  });
  batch.set(
    chatRef,
    {
      lastMessage: trimmed.slice(0, 100),
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();
  return newMsgRef.id;
}

//Escucha los mensajes de un grupo en tiempo real
export function listenGroupMessagesexport (
  groupId: string,
  onChange: (docs: Array<{ id: string } & MessageDoc>) => void,
  onError?: (err: any) => void,
  max = 200
): Unsubscribe {
  const q = query(
    collection(db, 'chats', String(groupId), 'messages'),
    orderBy('timestamp', 'asc'),
    limit(max),
  );
  return onSnapshot(q, snap => {
    const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as MessageDoc) }));
    onChange(items);
  }, onError);
}

/**
 * Marca el chat como leído para el usuario (si usas userChats/{uid}/chats/{chatId}).
 * Crea el doc si no existe (merge).
 */
export async function markAsRead(chatId: string) {
  const uid = requireUid();
  await setDoc(
    doc(db, 'userChats', uid, 'chats', String(chatId)),
    {
      chatId: String(chatId),
      lastReadAt: serverTimestamp(),
      // joinedAt podría venir del backend; aquí no lo tocamos si ya existe
    },
    { merge: true }
  );
}