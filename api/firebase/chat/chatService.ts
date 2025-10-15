// Code for Firestore chat service
import { auth, db } from '@/firebaseconfig';
import {
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
  getDocs,
  arrayRemove,
} from 'firebase/firestore';
import type { ChatDoc, GroupTileInfo, MessageDoc } from '../types';
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
    type: 'group',
    admins: ownerUid ? [ownerUid] : [],
    members: ownerUid ? [ownerUid] : [],
    ownerId: ownerUid || '',
    image: group.image || '',
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
  console.log(`🔍 getGroupTileInfo INICIADA para groupId: ${groupId}`);
  
  const uid = requireUid();
  console.log(`🔍 UID obtenido: ${uid}`);
  
  const chatRef = doc(db, 'chats', String(groupId));
  
  try {
    const [chatSnap, seenSnap] = await Promise.all([
      getDoc(chatRef), // requiere ser miembro (tus reglas)
      getDoc(doc(db, 'users', uid, 'chatState', String(groupId))), // permitido al propio usuario
    ]);

    console.log(`🔍 chatSnap exists: ${chatSnap.exists()}`);
    console.log(`🔍 seenSnap exists: ${seenSnap.exists()}`);

    if (!chatSnap.exists()) {
      console.error(`❌ Chat ${groupId} no existe o no tienes permisos`);
      throw new Error(`Chat ${groupId} not found or no access`);
    }

    const chat = chatSnap.data() as any;
    console.log(`🔍 Chat data:`, {
      name: chat?.name,
      members: chat?.members,
      membersCount: chat?.members?.length,
      isMember: chat?.members?.includes(uid),
      ownerId: chat?.ownerId,
      isOwner: chat?.ownerId === uid
    });
    
    // Verificar si realmente es miembro
    if (!chat?.members?.includes(uid)) {
      console.error(`❌ Usuario ${uid} NO es miembro del chat ${groupId}`);
      console.error(`❌ Miembros actuales:`, chat?.members);
      throw new Error(`User ${uid} is not a member of chat ${groupId}`);
    }

    const lastReadAt = seenSnap.exists() ? (seenSnap.data() as any).lastReadAt : null;

    // Cuenta no leídos = mensajes con timestamp > lastReadAt de otros usuarios
    const unreadCount = await getUnreadMessagesCount(groupId);
    
    const result: GroupTileInfo = {
      chatId: String(groupId),
      lastMessage: chat?.lastMessage ?? null,
      lastMessageAt: chat?.lastMessageAt ?? null,
      lastSenderId: chat?.lastSenderId ?? null,
      lastSenderName: chat?.lastSenderName ?? null,
      membersCount: Array.isArray(chat?.members) ? chat.members.length : 0,
      unreadCount: unreadCount,
    };
    
    console.log(`✅ GroupTileInfo generado:`, result);
    return result;
    
  } catch (error) {
    console.error(`❌ Error en getGroupTileInfo para grupo ${groupId}:`, error);
    throw error; // Re-lanzar para que el caller pueda manejarlo
  }
}

/**
 * Obtiene únicamente el número de mensajes no leídos de un chat específico
 * @param groupId ID del grupo/chat
 * @returns Promise<number> - Número de mensajes no leídos
 */
export async function getUnreadMessagesCount(groupId: string): Promise<number> {
  try {
    const uid = requireUid();
    console.log(`🔍 getUnreadMessagesCount para groupId: ${groupId}, uid: ${uid}`);
    
    // Consulta mensajes no leídos que NO sean del usuario actual
    const messagesQuery = query(
      collection(db, 'chats', String(groupId), 'messages'),
      where('read', '==', false),
      where('senderId', '!=', uid) // Excluir mis propios mensajes
    );

    console.log(`🔍 Ejecutando query de conteo para chat ${groupId}...`);
    const countSnapshot = await getCountFromServer(messagesQuery);
    const count = countSnapshot.data().count;
    
    console.log(`✅ Mensajes no leídos en chat ${groupId}: ${count}`);
    return count;
    
  } catch (error: any) {
    console.error(`❌ Error obteniendo mensajes no leídos para chat ${groupId}:`, error);
    console.error(`❌ Error code: ${error.code}, message: ${error.message}`);
    
    // Si es un error de permisos, intentar una consulta más simple
    if (error.code === 'permission-denied') {
      console.warn(`⚠️ Sin permisos para contar mensajes en chat ${groupId}, devolviendo 0`);
    }
    
    return 0; // Retorna 0 en caso de error
  }
}

// (Opcional) para varias tarjetas en paralelo:
export async function getGroupTilesInfo(groupIds: Array<string | number>) {
  console.log(`🔍 getGroupTilesInfo para grupos:`, groupIds);
  
  const promises = groupIds.map(async (id) => {
    try {
      const result = await getGroupTileInfo(String(id));
      console.log(`✅ Tile obtenido para grupo ${id}:`, result.chatId);
      return result;
    } catch (error) {
      console.error(`❌ Error obteniendo tile para grupo ${id}:`, error);
      // En lugar de fallar todo, devolver null para este grupo específico
      return null;
    }
  });
  
  const results = await Promise.all(promises);
  console.log(`🔍 Resultados de getGroupTilesInfo:`, results.map((r, i) => ({ 
    groupId: groupIds[i], 
    success: r !== null 
  })));
  
  // Filtrar los null (grupos que fallaron) y devolver solo los exitosos
  return results.filter((result): result is GroupTileInfo => result !== null);
}

// Eliminar miembro de un grupo
export async function removeMemberFromGroupFirebase(groupId: string, memberUid: string) {
  const chatRef = doc(db, 'chats', String(groupId));

  try {
    await updateDoc(chatRef, {
      members: arrayRemove(memberUid),
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ Miembro ${memberUid} eliminado del grupo ${groupId}`);
  } catch (e: any) {
    console.log('❌ Error eliminando miembro:', e.code, e.message);
    throw e;
  }
}

// Hacer admin a un miembro
export async function makeMemberAdminFirebase(groupId: string, memberUid: string) {
  const chatRef = doc(db, 'chats', String(groupId));

  try {
    await updateDoc(chatRef, {
      admins: arrayUnion(memberUid),
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ Miembro ${memberUid} promovido a admin en el grupo ${groupId}`);
  } catch (e: any) {
    console.log('❌ Error promoviendo a admin:', e.code, e.message);
    throw e;
  }
}

// Quitar admin a un miembro
export async function removeAdminFirebase(groupId: string, memberUid: string) {
  const chatRef = doc(db, 'chats', String(groupId));

  try {
    await updateDoc(chatRef, {
      admins: arrayRemove(memberUid),
      updatedAt: serverTimestamp(),
    });
    console.log(`✅ Miembro ${memberUid} degradado de admin en el grupo ${groupId}`);
  } catch (e: any) {
    console.log('❌ Error degradando de admin:', e.code, e.message);
    throw e;
  }
}

// Eliminar el grupo si eres admin
export async function deleteGroupFirebase(groupId: string) {
  const uid = requireUid();
  const chatRef = doc(db, 'chats', String(groupId));

  try {
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      throw new Error(`Chat ${groupId} not found`);
    }
    const chat = chatSnap.data() as any;
    if (chat.ownerId !== uid) {
      throw new Error('Only the owner can delete the group');
    }

    // Eliminar todos los mensajes primero
    const messagesRef = collection(db, 'chats', String(groupId), 'messages');
    const messagesSnap = await getDocs(messagesRef);
    const batch = writeBatch(db);
    messagesSnap.forEach(doc => {
      batch.delete(doc.ref);
    });
    batch.delete(chatRef); // Luego eliminar el chat
    await batch.commit();
    console.log(`✅ Grupo ${groupId} eliminado por el propietario ${uid}`);
  } catch (e: any) {
    console.log('❌ Error eliminando grupo:', e.code, e.message);
    throw e;
  }
}

// Función para validar permisos de edición (por si se necesita en el futuro)
export async function validateGroupEditPermissions(groupId: string): Promise<boolean> {
  const uid = requireUid();
  const chatRef = doc(db, 'chats', String(groupId));

  try {
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      throw new Error(`Chat ${groupId} not found`);
    }
    
    const chat = chatSnap.data() as ChatDoc;
    return chat.ownerId === uid || chat.admins.includes(uid);
  } catch (e: any) {
    console.log('❌ Error validating permissions:', e.code, e.message);
    return false;
  }
}