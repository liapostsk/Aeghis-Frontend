import { useEffect, useRef } from 'react';
import { auth } from '@/firebaseconfig';
import { useUserGroups } from '@/lib/hooks/useUserGroups';
import { listenGroupMessages } from '@/api/firebase/chat/chatService';
import { sendPushToUser } from '@/api/notifications/notificationsApi';
import { getUser } from '@/api/backend/user/userApi';
import { UserDto } from '@/api/backend/types';

/**
 * Hook que escucha mensajes de TODOS los grupos del usuario
 * y envía notificaciones automáticamente.
 * 
 * Debe montarse en app/_layout.tsx para funcionar globalmente.
 */
export function useChatNotifications() {
  const { groups, loading: groupsLoading } = useUserGroups(); // ✅ Usar hook existente
  const groupMembersCache = useRef(new Map<number, UserDto[]>());
  const processedMessages = useRef(new Set<string>()); // ✅ Evitar duplicados

  useEffect(() => {
    // ✅ Esperar a que termine de cargar
    if (groupsLoading) {
      console.log('⏳ [ChatNotifications] Cargando grupos...');
      return;
    }

    if (!groups || groups.length === 0) {
      console.log('⚠️ [ChatNotifications] Usuario sin grupos');
      return;
    }

    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      console.warn('⚠️ [ChatNotifications] Usuario no autenticado en Firebase');
      return;
    }

    console.log(`👂 [ChatNotifications] Escuchando ${groups.length} grupos...`);
    groups.forEach(g => console.log(`   - ${g.name} (ID: ${g.id})`));
    
    const unsubscribers: Array<() => void> = [];

    // ✅ Escuchar mensajes de TODOS los grupos
    groups.forEach((group) => {
      const groupId = group.id; // Mantener el tipo number
      const groupIdString = String(groupId); // Para Firebase
      
      const unsub = listenGroupMessages(
        groupIdString,
        async (messages) => {
          if (messages.length === 0) return;

          const latestMessage = messages[messages.length - 1];
          const messageKey = `${groupId}-${latestMessage.id}`;
          
          // ✅ Evitar procesar el mismo mensaje múltiples veces
          if (processedMessages.current.has(messageKey)) {
            return;
          }
          
          // Ignorar mensajes propios
          if (latestMessage.senderId === currentUid) {
            processedMessages.current.add(messageKey);
            return;
          }

          // Verificar si ya lo leíste
          if (latestMessage.readBy?.includes(currentUid)) {
            processedMessages.current.add(messageKey);
            return;
          }

          console.log(`📬 [ChatNotifications] Nuevo mensaje en grupo ${groupId}`);
          console.log(`   De: ${latestMessage.senderName}`);
          console.log(`   Mensaje: ${latestMessage.content.substring(0, 50)}...`);

          // ✅ Cargar miembros del grupo (con caché)
          let groupMembers = groupMembersCache.current.get(groupId);
          
          if (!groupMembers) {
            console.log(`📥 [ChatNotifications] Cargando miembros del grupo ${group.name}...`);
            
            try {
              const memberPromises = group.membersIds.map(id => getUser(id));
              groupMembers = await Promise.all(memberPromises);
              groupMembersCache.current.set(groupId, groupMembers);
              
              console.log(`✅ [ChatNotifications] ${groupMembers.length} miembros cargados`);
            } catch (error) {
              console.error(`❌ Error cargando miembros del grupo ${group.name}:`, error);
              return;
            }
          }

          // ✅ Encontrar usuarios que NO han leído
          const unreadMembers = groupMembers.filter(member => {
            const hasRead = latestMessage.readBy?.includes(member.clerkId);
            const isSender = member.clerkId === latestMessage.senderId;
            return !hasRead && !isSender;
          });

          // ✅ Enviar notificaciones
          if (unreadMembers.length > 0) {
            console.log(`📤 [ChatNotifications] Enviando a ${unreadMembers.length} usuarios...`);
            
            const notificationPromises = unreadMembers.map(async (member) => {
                console.log(`  🔔 Enviando a ${member.name} (ID: ${member.id})...`);
              try {
                await sendPushToUser({
                  userId: member.id,
                  title: latestMessage.senderName || 'Nuevo mensaje',
                  body: latestMessage.content.length > 100 
                    ? latestMessage.content.substring(0, 100) + '...' 
                    : latestMessage.content,
                  data: {
                    type: 'chat_message',
                    groupId: groupIdString,
                    screen: `/chat?groupId=${groupId}`,
                  },
                  channelId: 'chat',
                });
                
                console.log(`  ✅ Notificación enviada a ${member.name}`);
              } catch (error) {
                console.warn(`  ⚠️ Error enviando notificación a ${member.name}:`, error);
              }
            });

            await Promise.allSettled(notificationPromises);
          }

          // ✅ Marcar como procesado
          processedMessages.current.add(messageKey);
        },
        (error) => {
          console.error(`❌ [ChatNotifications] Error en grupo ${groupId}:`, error);
        }
      );

      unsubscribers.push(unsub);
    });

    // ✅ Cleanup
    return () => {
      console.log('🧹 [ChatNotifications] Limpiando listeners...');
      unsubscribers.forEach(unsub => unsub());
      groupMembersCache.current.clear();
      processedMessages.current.clear();
    };
  }, [groups, groupsLoading]);
}