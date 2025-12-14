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
  Unsubscribe,
  arrayUnion,
  writeBatch,
  limit,
  getDocs,
  arrayRemove,
} from 'firebase/firestore';
import type { ChatDoc, GroupTileInfo, MessageDoc, ChatType } from '../types';
import { Group } from '../../backend/group/groupType';

/**
 * Asegura que hay sesión de Firebase y devuelve el uid.
 * Lanza error si no hay sesión (enlaza Clerk→Firebase antes de usar el servicio).
 */
function requireUid(): string {
  const uid = auth.currentUser?.uid;
  console.log('requireUid - Usuario actual:', uid);
  if (!uid) {
    console.error('No Firebase session en requireUid');
    throw new Error('No Firebase session. Call linkFirebaseSessionOnce() after Clerk login.');
  }
  return uid;
}

// Creación de chats en Firestore
export async function createGroupFirebase(group: Partial<Group>): Promise<string> {
  console.log('createGroupFirebase - Creando grupo:', group.id, group.name);
  
  try {
    const ownerUid = requireUid();
    const chatRef = doc(db, 'chats', String(group.id));
    const now = serverTimestamp();

    const payload: ChatDoc = {
      type: group.type as ChatType || 'CONFIANZA',
      admins: ownerUid ? [ownerUid] : [],
      members: ownerUid ? [ownerUid] : [],
      ownerId: ownerUid || '',
      image: group.imageUrl || '',
      lastMessage: null as unknown as MessageDoc,
      lastMessageAt: "",
    };

    console.log('Guardando grupo en Firestore...');
    await setDoc(chatRef, payload, { merge: true });
    console.log('Grupo creado exitosamente en Firebase:', chatRef.id);
    return chatRef.id;
  } catch (error: any) {
    console.error('Error creando grupo en Firebase:', error);
    console.error('Error details:', { code: error?.code, message: error?.message, groupId: group.id });
    throw error;
  }
}

// Auto-unión a grupo en Firestore
export async function joinGroupChatFirebase(groupId: string) {
  console.log('joinGroupChatFirebase - Uniéndose al grupo:', groupId);
  
  try {
    const uid = requireUid();
    const chatRef = doc(db, 'chats', String(groupId));

    console.log('Añadiendo usuario a miembros del grupo...');
    await updateDoc(chatRef, {
      members: arrayUnion(uid),
      updatedAt: serverTimestamp(),
    });
    console.log('Usuario unido exitosamente al grupo:', groupId);
  } catch (e: any) {
    console.error('Error uniéndose al grupo:', e.code, e.message);
    console.error('Join failed details:', { groupId, code: e.code, message: e.message });
    throw e;
  }
}

export async function joinGroupChatFirebaseWithClerkId(groupId: string, clerkId: string) {
  console.log('joinGroupChatFirebase - Uniéndose al grupo:', groupId);
  
  try {
    const uid = clerkId;
    const chatRef = doc(db, 'chats', String(groupId));

    console.log('Añadiendo usuario a miembros del grupo...');
    await updateDoc(chatRef, {
      members: arrayUnion(uid),
      updatedAt: serverTimestamp(),
    });
    console.log('Usuario unido exitosamente al grupo:', groupId);
  } catch (e: any) {
    console.error('Error uniéndose al grupo:', e.code, e.message);
    console.error('Join failed details:', { groupId, code: e.code, message: e.message });
    throw e;
  }
}

// FUNCIONES DE MENSAJERÍA

export async function sendMessageFirebase(
  groupId: string, 
  text: string,
  type: 'text' | 'status' | 'arrival' | 'journey_request' = 'text'
) {
  
  try {
    const uid = requireUid();
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    const userSnap = await getDoc(doc(db, 'users', uid));
    const senderName =
      (userSnap.exists() && (userSnap.data() as any).displayName) ||
      (userSnap.exists() && (userSnap.data() as any).name) ||
      'Unknown';

    const chatRef = doc(db, 'chats', groupId);
    const messagesRef = collection(db, 'chats', groupId, 'messages');
    const newMsgRef = doc(messagesRef);
    const batch = writeBatch(db);
    batch.set(newMsgRef, {
      senderId: uid,
      senderName: senderName,
      type: type,
      content: trimmed,
      readBy: [uid],
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
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    throw error;
  }
}

export async function markAllMessagesAsRead(groupId: string): Promise<void> {
  
  try {
    const uid = requireUid();
    
    const messagesRef = collection(db, 'chats', String(groupId), 'messages');
    const allMessagesSnapshot = await getDocs(
      query(messagesRef, orderBy('timestamp', 'desc'), limit(100))
    );
    
    const unreadMessages = allMessagesSnapshot.docs.filter(doc => {
      const data = doc.data();
      const readBy = data.readBy || [];
      
      return !readBy.includes(uid);
    });
    
    if (unreadMessages.length === 0) {
      return;
    }
    
    const batch = writeBatch(db);
    
    unreadMessages.forEach(docSnap => {
      batch.update(docSnap.ref, {
        readBy: arrayUnion(uid),
      });
    });
    
    await batch.commit();
    
  } catch (error: any) {
    console.error("Error details:", error?.code, error?.message);
  }
}

/**
 * Marcar un mensaje específico como leído
 * NUEVO: Función para marcar mensaje individual
 */
export async function markMessageAsRead(groupId: string, messageId: string): Promise<void> {
  console.log('markMessageAsRead - Marcando mensaje:', { groupId, messageId });
  
  try {
    const uid = requireUid();
    const messageRef = doc(db, 'chats', String(groupId), 'messages', messageId);
    
    const messageSnap = await getDoc(messageRef);
    if (!messageSnap.exists()) {
      console.warn('Mensaje no encontrado:', messageId);
      return;
    }
    
    const data = messageSnap.data();
    const readBy = data.readBy || [];
    
    // No hacer nada si ya está leído
    if (readBy.includes(uid)) {
      console.log('Mensaje ya marcado como leído');
      return;
    }
    
    // No marcar como leído si es el remitente
    if (data.senderId === uid) {
      console.log('No marcar propio mensaje como leído');
      return;
    }
    
    console.log('Agregando usuario a readBy...');
    await updateDoc(messageRef, {
      readBy: arrayUnion(uid),
    });
    
    console.log('Mensaje marcado como leído');
  } catch (error) {
    console.error('Error marcando mensaje como leído:', error);
  }
}

/**
 * Obtener usuarios que NO han leído un mensaje específico
 * NUEVO: Para enviar notificaciones selectivas
 */
export async function getUnreadUserIds(
  groupId: string,
  messageId: string,
  allMemberClerkIds: string[]
): Promise<string[]> {
  console.log('getUnreadUserIds:', { groupId, messageId });
  
  try {
    const messageRef = doc(db, 'chats', String(groupId), 'messages', messageId);
    const messageSnap = await getDoc(messageRef);
    
    if (!messageSnap.exists()) {
      console.warn('Mensaje no encontrado');
      return [];
    }
    
    const data = messageSnap.data();
    const readBy = data.readBy || [];
    const senderId = data.senderId;
    
    // Filtrar: miembros que NO están en readBy y NO son el remitente
    const unreadUsers = allMemberClerkIds.filter(
      clerkId => !readBy.includes(clerkId) && clerkId !== senderId
    );
    
    console.log(`${unreadUsers.length} usuarios no han leído el mensaje`);
    return unreadUsers;
    
  } catch (error) {
    console.error('Error obteniendo usuarios no leídos:', error);
    return [];
  }
}

export async function markChatSeen(groupId: string) {
  console.log('markChatSeen - Marcando chat como visto:', groupId);
  
  try {
    const uid = requireUid();
    const ref = doc(db, 'users', uid, 'chatState', String(groupId));
    
    console.log('Actualizando estado de chat visto...');
    await setDoc(ref, { lastReadAt: serverTimestamp() }, { merge: true });
    console.log('Chat marcado como visto exitosamente');
  } catch (error: any) {
    console.error('Error marcando chat como visto:', error);
    console.error('MarkChatSeen error details:', { 
      code: error?.code, 
      message: error?.message, 
      groupId 
    });
    throw error;
  }
}

export function listenGroupMessages(
  groupId: string,
  onChange: (docs: Array<{ id: string } & MessageDoc>) => void,
  onError?: (err: any) => void,
  max = 200
): Unsubscribe {
  
  try {
    const q = query(
      collection(db, 'chats', String(groupId), 'messages'),
      orderBy('timestamp', 'asc'),
      limit(max),
    );
    
    return onSnapshot(q, snap => {
      const items = snap.docs.map(d => {
        const data = d.data() as MessageDoc;
        return { ...data, id: d.id };
      });
      onChange(items);
    }, (error) => {
      if (error?.code === 'permission-denied') {
        onChange([]);
        return;
      }
      if (onError) onError(error);
    });
  } catch (error) {
    console.error('Error configurando listener de mensajes:', error);
    throw error;
  }
}

export  async function getGroupTileInfo(groupId: string): Promise<GroupTileInfo> {
  console.log(`getGroupTileInfo INICIADA para groupId: ${groupId}`);
  
  const uid = requireUid();
  console.log(`UID obtenido: ${uid}`);
  
  const chatRef = doc(db, 'chats', String(groupId));
  
  try {
    const [chatSnap, seenSnap] = await Promise.all([
      getDoc(chatRef), // requiere ser miembro (tus reglas)
      getDoc(doc(db, 'users', uid, 'chatState', String(groupId))), // permitido al propio usuario
    ]);

    console.log(`chatSnap exists: ${chatSnap.exists()}`);
    console.log(`seenSnap exists: ${seenSnap.exists()}`);

    if (!chatSnap.exists()) {
      console.error(`Chat ${groupId} no existe o no tienes permisos`);
      throw new Error(`Chat ${groupId} not found or no access`);
    }

    const chat = chatSnap.data() as any;
    console.log(`Chat data:`, {
      name: chat?.name,
      members: chat?.members,
      membersCount: chat?.members?.length,
      isMember: chat?.members?.includes(uid),
      ownerId: chat?.ownerId,
      isOwner: chat?.ownerId === uid
    });
    
    // Verificar si realmente es miembro
    if (!chat?.members?.includes(uid)) {
      console.error(`Usuario ${uid} NO es miembro del chat ${groupId}`);
      console.error(`Miembros actuales:`, chat?.members);
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
    
    console.log(`GroupTileInfo generado:`, result);
    return result;
    
  } catch (error) {
    console.error(`Error en getGroupTileInfo para grupo ${groupId}:`, error);
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
    console.log(`getUnreadMessagesCount para groupId: ${groupId}, uid: ${uid}`);
    
    // Obtener todos los mensajes recientes
    const messagesRef = collection(db, 'chats', String(groupId), 'messages');
    const messagesSnapshot = await getDocs(
      query(messagesRef, orderBy('timestamp', 'desc'), limit(100))
    );
    
    // Contar mensajes donde el usuario NO está en readBy y NO es el remitente
    let count = 0;
    messagesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const readBy = data.readBy || [];
      const senderId = data.senderId;
      
      if (!readBy.includes(uid) && senderId !== uid) {
        count++;
      }
    });
    
    console.log(`Mensajes no leídos en chat ${groupId}: ${count}`);
    return count;
    
  } catch (error: any) {
    console.error(`Error obteniendo mensajes no leídos para chat ${groupId}:`, error);
    console.error(`Error code: ${error?.code}, message: ${error?.message}`);
    
    if (error?.code === 'permission-denied') {
      console.warn(`Sin permisos para contar mensajes en chat ${groupId}, devolviendo 0`);
    }
    
    return 0;
  }
}

// (Opcional) para varias tarjetas en paralelo:
export async function getGroupTilesInfo(groupIds: Array<string | number>) {
  console.log(`getGroupTilesInfo para grupos:`, groupIds);
  
  const promises = groupIds.map(async (id) => {
    try {
      const result = await getGroupTileInfo(String(id));
      console.log(`Tile obtenido para grupo ${id}:`, result.chatId);
      return result;
    } catch (error) {
      console.error(`Error obteniendo tile para grupo ${id}:`, error);
      // En lugar de fallar todo, devolver null para este grupo específico
      return null;
    }
  });
  
  const results = await Promise.all(promises);
  console.log(`Resultados de getGroupTilesInfo:`, results.map((r, i) => ({ 
    groupId: groupIds[i], 
    success: r !== null 
  })));
  
  // Filtrar los null (grupos que fallaron) y devolver solo los exitosos
  return results.filter((result): result is GroupTileInfo => result !== null);
}

// ===== FUNCIONES DE ADMINISTRACIÓN DE GRUPOS =====

/**
 * Promover un usuario a administrador en Firebase
 * @param groupId ID del grupo
 * @param userClerkId Clerk ID del usuario a promover
 */
export async function makeMemberAdminFirebase(groupId: string, userClerkId: string): Promise<void> {
  console.log('makeMemberAdminFirebase - Promoviendo usuario a admin:', { groupId, userClerkId });
  
  try {
    const uid = requireUid();
    const chatRef = doc(db, 'chats', String(groupId));

    // Verificar que el usuario actual es admin
    const chatDoc = await getDoc(chatRef);
    if (!chatDoc.exists()) {
      throw new Error(`Chat ${groupId} no existe`);
    }

    const chatData = chatDoc.data() as any;
    if (!chatData.admins?.includes(uid)) {
      throw new Error('No tienes permisos de administrador');
    }

    // Agregar el usuario a la lista de admins si no está ya
    console.log('Agregando usuario a lista de administradores...');
    await updateDoc(chatRef, {
      admins: arrayUnion(userClerkId),
      updatedAt: serverTimestamp(),
    });
    
    console.log('Usuario promovido a administrador exitosamente');
  } catch (error) {
    console.error('Error promoviendo usuario a admin:', error);
    throw error;
  }
}

/**
 * Degradar un administrador a miembro regular en Firebase
 * @param groupId ID del grupo
 * @param userClerkId Clerk ID del usuario a degradar
 */
export async function removeAdminFirebase(groupId: string, userClerkId: string): Promise<void> {
  console.log('removeAdminFirebase - Degradando admin a miembro:', { groupId, userClerkId });
  
  try {
    const uid = requireUid();
    const chatRef = doc(db, 'chats', String(groupId));

    // Verificar que el usuario actual es admin
    const chatDoc = await getDoc(chatRef);
    if (!chatDoc.exists()) {
      throw new Error(`Chat ${groupId} no existe`);
    }

    const chatData = chatDoc.data() as any;
    if (!chatData.admins?.includes(uid)) {
      throw new Error('No tienes permisos de administrador');
    }

    // Verificar que no se está auto-degradando si es el único admin
    if (chatData.admins?.length <= 1 && userClerkId === uid) {
      throw new Error('No puedes degradarte siendo el único administrador');
    }

    // Remover el usuario de la lista de admins
    console.log('Removiendo usuario de lista de administradores...');
    await updateDoc(chatRef, {
      admins: arrayRemove(userClerkId),
      updatedAt: serverTimestamp(),
    });
    
    console.log('Usuario degradado de administrador exitosamente');
  } catch (error) {
    console.error('Error degradando admin:', error);
    throw error;
  }
}

/**
 * Remover un miembro del grupo en Firebase
 * @param groupId ID del grupo
 * @param userClerkId Clerk ID del usuario a remover
 */
export async function removeMemberFromGroupFirebase(groupId: string, userClerkId: string): Promise<void> {
  console.log('removeMemberFromGroupFirebase - Removiendo miembro:', { groupId, userClerkId });
  
  try {
    const uid = requireUid();
    const chatRef = doc(db, 'chats', String(groupId));

    // Verificar que el usuario actual es admin
    const chatDoc = await getDoc(chatRef);
    if (!chatDoc.exists()) {
      throw new Error(`Chat ${groupId} no existe`);
    }

    const chatData = chatDoc.data() as any;
    if (!chatData.admins?.includes(uid)) {
      throw new Error('No tienes permisos de administrador');
    }

    // No permitir auto-remover si es el único admin
    if (chatData.admins?.includes(userClerkId) && chatData.admins?.length <= 1) {
      throw new Error('No puedes removerte siendo el único administrador');
    }

    console.log('Removiendo usuario del grupo...');
    const batch = writeBatch(db);
    
    // Remover de miembros y admins
    batch.update(chatRef, {
      members: arrayRemove(userClerkId),
      admins: arrayRemove(userClerkId),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    console.log('Miembro removido exitosamente');
  } catch (error) {
    console.error('Error removiendo miembro:', error);
    throw error;
  }
}

/**
 * Eliminar un grupo completamente de Firebase
 * @param groupId ID del grupo a eliminar
 */
export async function deleteGroupFirebase(groupId: string): Promise<void> {
  console.log('deleteGroupFirebase - Eliminando grupo:', groupId);
  
  try {
    const uid = requireUid();
    const chatRef = doc(db, 'chats', String(groupId));

    // Verificar que el usuario actual es admin/owner
    const chatDoc = await getDoc(chatRef);
    if (!chatDoc.exists()) {
      console.log('Chat ya no existe, considerando como eliminado');
      return;
    }

    const chatData = chatDoc.data() as any;
    if (!chatData.admins?.includes(uid) && chatData.ownerId !== uid) {
      throw new Error('No tienes permisos para eliminar este grupo');
    }

    console.log('Eliminando chat...');
    
    const batch = writeBatch(db);
    
    // Eliminar el documento principal del chat
    batch.delete(chatRef);

    // Nota: En un entorno de producción, deberías usar Cloud Functions
    // para eliminar las subcollections (messages) de forma segura
    // Por ahora solo eliminamos el documento principal
    
    await batch.commit();
    console.log('Grupo eliminado exitosamente de Firebase');
    
    // Pequeña espera para dar tiempo a que los listeners se desconecten
    // y procesen el cambio antes de continuar
    await new Promise(resolve => setTimeout(resolve, 300));
    
  } catch (error) {
    console.error('Error eliminando grupo:', error);
    throw error;
  }
}

/**
 * Actualizar información del grupo en Firebase cuando cambia en el backend
 * @param group Datos actualizados del grupo
 */
export async function updateGroupFirebase(group: Group): Promise<void> {
  console.log('updateGroupFirebase - Actualizando grupo:', group.id, group.name);
  
  try {
    const chatRef = doc(db, 'chats', String(group.id));

    console.log('Actualizando información del grupo en Firebase...');
    await setDoc(chatRef, {
      // Convertir IDs numéricos a strings para Clerk IDs si es necesario
      // members: group.membersIds?.map(id => String(id)) || [],
      // admins: group.adminsIds?.map(id => String(id)) || [],
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    console.log('Grupo actualizado exitosamente en Firebase');
  } catch (error: any) {
    console.error('Error actualizando grupo en Firebase:', error);
    console.error('UpdateGroup error details:', { 
      code: error?.code, 
      message: error?.message, 
      groupId: group.id 
    });
    throw error;
  }
}