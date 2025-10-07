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
  getCountFromServer,
  increment,
  getDocs,
} from 'firebase/firestore';
import type { ChatDoc, GroupTileInfo, MessageDoc } from '../firebaseTypes';
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
  const userSnap = await getDoc(doc(db, 'users', uid));
  const senderName =
  (userSnap.exists() && (userSnap.data() as any).displayName) ||
  (userSnap.exists() && (userSnap.data() as any).name) ||
  'Unknown';
  const trimmed = text.trim();
  if (!trimmed) return;

  const chatRef = doc(db, 'chats', groupId);
  const messagesRef = collection(db, 'chats', groupId, 'messages');
  const newMsgRef = doc(messagesRef); // generas ID primero

  const batch = writeBatch(db);
  batch.set(newMsgRef, {
    senderId: uid,
    senderName: senderName,
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
      lastSenderId: uid,
      lastSenderName: senderName,
    },
    { merge: true }
  );

  await batch.commit();
  return newMsgRef.id;
}

export async function markAllMessagesAsRead(groupId: string) {
  console.log("🔍 markAllMessagesAsRead INICIADA para groupId:", groupId);
  
  try {
    const uid = requireUid();
    console.log("🔍 UID obtenido:", uid);
    
    const messagesQuery = query(
      collection(db, 'chats', String(groupId), 'messages'),
      where('read', '==', false), // Solo esta condición primero
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(messagesQuery);
    
    const otherUsersMessages = snapshot.docs.filter(doc => {
      const data = doc.data();
      return data.senderId !== uid; // Excluir mis propios mensajes
    });
    
    if (otherUsersMessages.length === 0) {
      console.log("ℹ️ No hay mensajes de otros usuarios para marcar como leídos");
      return;
    }
    
    const batch = writeBatch(db);
    
    otherUsersMessages.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    
    await batch.commit();
    console.log(`✅ ${otherUsersMessages.length} mensajes marcados como leídos`);
    
  } catch (error) {
    console.error("❌ Error en markAllMessagesAsRead:", error);
    console.error("❌ Error details:", error.code, error.message);
  }
}

export async function markChatSeen(groupId: string) {
  const uid = requireUid();
  const ref = doc(db, 'users', uid, 'chatState', String(groupId));
  
  await setDoc(ref, { lastReadAt: serverTimestamp() }, { merge: true });
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




export  async function getGroupTileInfo(groupId: string): Promise<GroupTileInfo> {
  const uid = requireUid();
  const chatRef = doc(db, 'chats', String(groupId));
  const [chatSnap, seenSnap] = await Promise.all([
    getDoc(chatRef), // requiere ser miembro (tus reglas)
    getDoc(doc(db, 'users', uid, 'chatState', String(groupId))), // permitido al propio usuario
  ]);

  const chat = chatSnap.exists() ? (chatSnap.data() as any) : null;
  const lastReadAt = seenSnap.exists() ? (seenSnap.data() as any).lastReadAt : null;

  // Cuenta no leídos = mensajes con timestamp > lastReadAt de otros usuarios
  const unreadCount = await getUnreadMessagesCount(groupId);
  
  return {
    chatId: String(groupId),
    lastMessage: chat?.lastMessage ?? null,
    lastMessageAt: chat?.lastMessageAt ?? null,
    lastSenderId: chat?.lastSenderId ?? null,
    lastSenderName: chat?.lastSenderName ?? null,
    membersCount: Array.isArray(chat?.members) ? chat.members.length : 0,
    unreadCount: unreadCount,
  };
}

/**
 * Obtiene únicamente el número de mensajes no leídos de un chat específico
 * @param groupId ID del grupo/chat
 * @returns Promise<number> - Número de mensajes no leídos
 */
export async function getUnreadMessagesCount(groupId: string): Promise<number> {
  try {
    const uid = requireUid();
    
    // Consulta mensajes no leídos que NO sean del usuario actual
    const messagesQuery = query(
      collection(db, 'chats', String(groupId), 'messages'),
      where('read', '==', false),
      where('senderId', '!=', uid) // Excluir mis propios mensajes
    );
    console.log("Query para contar mensajes no leídos:", messagesQuery);

    const countSnapshot = await getCountFromServer(messagesQuery);
    console.log(`🧮 Mensajes no leídos en chat ${groupId}:`, countSnapshot.data().count);
    return countSnapshot.data().count;
    
  } catch (error) {
    console.error("❌ Error obteniendo mensajes no leídos:", error);
    return 0; // Retorna 0 en caso de error
  }
}

// (Opcional) para varias tarjetas en paralelo:
export async function getGroupTilesInfo(groupIds: Array<string | number>) {
  return Promise.all(groupIds.map((id) => getGroupTileInfo(String(id))));
}