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

// Join group chat
export async function joinGroupChatFirebase(groupId: string) {
  console.log("Joining Firebase group chat with ID:", groupId);
  const uid = requireUid();
  const chatRef = doc(db, 'chats', String(groupId));
  const snap = await getDoc(chatRef);
  if (!snap.exists()) throw new Error('Chat does not exist');

  // Evita carreras/duplicados
  await updateDoc(chatRef, {
    members: arrayUnion(uid),
    updatedAt: serverTimestamp(),
  });
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

// sendMessageToGroup
export async function sendMessageFirebase(groupId: string, text: string ) {
  const uid = requireUid();

  const messagesRef = collection(db, 'chats', String(groupId), 'messages');

  await addDoc(messagesRef, {
    senderId: uid,
    type: 'text',
    content: text.trim(),
    read: false,
    timestamp: serverTimestamp(),
  });

  // Actualizar lastMessage y lastMessageAt en el chat
  const chatRef = doc(db, 'chats', groupId);
  await setDoc(chatRef, {
    lastMessage: text.slice(0, 100),
    lastMessageAt: serverTimestamp(),
  }, { merge: true });

  return messagesRef.id;
}

//Escucha los mensajes de un grupo en tiempo real
export function listenGroupMessages(
  groupId: number,
  onUpdate: (messages: MessageDoc[]) => void
): Unsubscribe {
  const messagesRef = collection(db, 'chats', String(groupId), 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MessageDoc[];
    
    onUpdate(messages);
  });
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