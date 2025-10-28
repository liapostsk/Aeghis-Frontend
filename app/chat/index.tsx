import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  StatusBar,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { Group } from '@/api/group/groupType';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { getGroupById } from '@/api/group/groupApi';
import { sendMessageFirebase, listenGroupMessagesexport, markAllMessagesAsRead} from '@/api/firebase/chat/chatService';
import { auth } from '@/firebaseconfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import InviteModal from '@/components/groups/InviteModal';
import { getCurrentJourneyForGroup } from '@/api/journeys/journeyApi';
import { JourneyDto } from '@/api/journeys/journeyType';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  time: string;
  isUser?: boolean;
  isRead?: boolean;
  type?: 'message' | 'status' | 'arrival';
}

export default function ChatScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeJourney, setActiveJourney] = useState<JourneyDto | null>(null);

  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  function formatHourMin(d: Date) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const renderJourneyBanner = () => {
    console.log('Rendering journey banner, activeJourney:', activeJourney);
    if (!activeJourney) return null;
    
    const isInProgress = activeJourney.state === 'IN_PROGRESS';
    const isPending = activeJourney.state === 'PENDING';
    
    // Solo mostrar si está PENDING o IN_PROGRESS
    if (!isInProgress && !isPending) return null;

    const handleJoinJourney = () => {
      const journeyInfo = {
        journeyId: activeJourney.id,
        journeyType: activeJourney.journeyType,
        state: activeJourney.state,
        groupId: activeJourney.groupId,
        startDate: new Date(activeJourney.iniDate).toLocaleDateString()
      };
      
      console.log('🚗 Usuario quiere unirse al journey:', journeyInfo);
    };

    const getJourneyDisplayInfo = () => {
      const typeDisplayName = {
        'INDIVIDUAL': 'Individual',
        'COMMON_DESTINATION': 'Grupal',
        'PERSONALIZED': 'Grupal'
      }[activeJourney.journeyType] || 'Desconocido';

      if (isInProgress) {
        return {
          icon: 'navigate-circle' as const,
          title: `Trayecto ${typeDisplayName.toLowerCase()} en progreso`,
          subtitle: 'El trayecto ha comenzado. ¡Únete ahora!',
          color: '#10B981',
          bgColor: '#ECFDF5',
          buttonText: 'Unirse al trayecto'
        };
      } else {
        return {
          icon: 'time' as const,
          title: `Trayecto ${typeDisplayName.toLowerCase()} pendiente`,
          subtitle: 'Esperando a que más miembros se unan',
          color: '#F59E0B',
          bgColor: '#FFFBEB',
          buttonText: 'Unirse al trayecto'
        };
      }
    };

    const displayInfo = getJourneyDisplayInfo();

    return (
      <View style={styles.journeyBannerContainer}>
        <Pressable style={styles.journeyBannerButton} onPress={handleJoinJourney}>
          <View style={styles.journeyBannerContent}>
            <View style={[styles.journeyIconContainer, { backgroundColor: displayInfo.bgColor }]}>
              <Ionicons name={displayInfo.icon} size={24} color={displayInfo.color} />
            </View>
            
            <View style={styles.journeyTextContainer}>
              <Text style={styles.journeyBannerTitle}>
                {displayInfo.title}
              </Text>
              <Text style={styles.journeyBannerSubtitle}>
                {displayInfo.subtitle}
              </Text>
            </View>
            
            <View style={styles.journeyActionContainer}>
              <Text style={styles.joinButtonText}>{displayInfo.buttonText}</Text>
              <Ionicons name="chevron-forward" size={18} color="#7A33CC" />
            </View>
          </View>
        </Pressable>
      </View>
    );
  };

  useEffect(() => {
    // Marcar como leídos cuando se abre el chat
    if (groupId) {
      console.log ("Marking messages as read for group:", groupId);
      markAllMessagesAsRead(String(groupId));
      console.log("Messages marked as read.");
    }
  }, [groupId]);

  useEffect(() => {
  if (!groupId) return;
  const uid = auth.currentUser?.uid;

  const unsub = listenGroupMessagesexport(
    String(groupId),
    (docs) => {
      const ui = docs.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.senderName || 'Unknown',
        content: m.content ?? '',
        time: (m.timestamp?.toDate ? formatHourMin(m.timestamp.toDate()) : 'enviando…'),
        isUser: m.senderId === uid,
        isRead: m.read || false,
        type: 'message' as const,
      }));
      setMessages(ui);
    },
    (err) => console.warn('No se pudieron leer mensajes:', err)
  );

  return unsub;
}, [groupId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const token = await getToken();
        setToken(token);

        const id = Number(groupId);
        if (!id || Number.isNaN(id)) {
          throw new Error('Invalid group id');
        }

        const [groupData, journeyData] = await Promise.all([
          getGroupById(id),
          getCurrentJourneyForGroup(id).catch(() => null) // Si no hay journey, devolver null
        ]);

        console.log('Loaded journey data:', journeyData);
        
        if (mounted) {
          setGroup(groupData);
          setActiveJourney(journeyData);
          setError(null);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Unable to load group');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [groupId]);



  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    setInputText('');
    try {
      await sendMessageFirebase(groupId, text);
      // No haces setMessages aquí: el listener lo recibe y renderiza.
    } catch (e) {
      console.warn('No se pudo enviar el mensaje', e);
      // Si quieres, repones el texto en inputText o muestras Alert.
    }
  };


  const renderMessage = ({ item }: { item: Message }) => {
    if (item.type === 'arrival') {
      return (
        <View style={styles.arrivalContainer}>
          <View style={styles.arrivalBubble}>
            <Text style={styles.arrivalText}>{item.content}</Text>
          </View>
          <Text style={styles.arrivalTime}>{item.time}</Text>
        </View>
      );
    }

    if (item.isUser) {
      return (
        <View style={styles.userMessageContainer}>
          <View style={styles.userBubble}>
            <Text style={styles.userMessageText}>{item.content}</Text>
          </View>
          <View style={styles.userMessageInfo}>
            <Text style={styles.messageTime}>{item.time}</Text>
            <View style={styles.checkMarkContainer}>
              {item.isRead ? (
                <>
                  <Ionicons name="checkmark" size={12} style={[styles.checkIcon, styles.doubleCheck]} />
                  <Ionicons name="checkmark" size={12} style={[styles.checkIcon, styles.doubleCheck, styles.secondCheck]} />
                </>
              ) : (
                <Ionicons name="checkmark" size={12} style={styles.checkIcon} />
              )}
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.otherMessageContainer}>
        <Text style={styles.senderName}>{item.senderName}</Text>
        <View style={styles.otherBubble}>
          <Text style={styles.otherMessageText}>{item.content}</Text>
        </View>
        <Text style={styles.messageTime}>{item.time}</Text>
      </View>
    );
  };

  /** -------- GUARDS -------- */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Cargando grupo…</Text>
      </View>
    );
  }

  if (error || !group) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? 'Group not found'}</Text>
      </View>
    );
  }
  /** -------- A partir de aquí, `group` es seguro (no null) -------- */

  // Derivados seguros del grupo
  const members = Array.isArray(group.membersIds) ? group.membersIds : [];
  console.log('Members:', members);
  console.log('Group data:', group);
  const totalMembers = members.length;
  const hasEnoughMembers = totalMembers >= 2;
  const activeMembersCount = members.length; // Mock: todos activos por ahora

  const renderInvitationScreen = (g: Group) => (
    <View style={styles.invitationContainer}>
      <View style={styles.invitationIcon}>
        <Ionicons name="people-outline" size={64} color="#7A33CC" />
      </View>

      <Text style={styles.invitationTitle}>¡Invita a más personas!</Text>
      <Text style={styles.invitationSubtitle}>
        Necesitas al menos 2 miembros para usar este grupo de{' '}
        {g.type?.toLowerCase() || 'confianza'}
      </Text>

      <Pressable style={styles.invitationButton} onPress={() => setShowInviteModal(true)}>
        <Ionicons name="share-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
        <Text style={styles.invitationButtonText}>Generar invitación</Text>
      </Pressable>

      <Text style={styles.invitationHelp}>
        Comparte el enlace de invitación con las personas que quieres añadir al grupo
      </Text>
    </View>
  );

  const renderChatScreen = (g: Group) => {
    // Calcular si necesitamos padding extra para el banner del journey
    const hasActiveJourney = activeJourney && (activeJourney.state === 'PENDING' || activeJourney.state === 'IN_PROGRESS');
    const journeyBannerHeight = hasActiveJourney ? 92 : 0; // Altura aproximada del banner

    return (
      <View style={styles.chatContainer}>
        {/* Banner del Journey - Posición fija arriba */}
        {renderJourneyBanner()}

        {g.state === 'ACTIVO' && (
          <View style={[styles.tripStatus, hasActiveJourney && { marginTop: journeyBannerHeight + 16 }]}>
            <Ionicons name="location" size={20} style={styles.locationIcon} />
            <View style={styles.tripStatusInfo}>
              <Text style={styles.tripStatusText}>Trip active • Share location active</Text>
              <Pressable onPress={() => { console.log('Mostrar ubicaciones del viaje'); }}>
                <Text style={styles.showLocationsText}>Show locations</Text>
              </Pressable>
            </View>
          </View>
        )}

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 && styles.emptyMessagesContent,
            hasActiveJourney && { paddingTop: journeyBannerHeight + 16 }, // Espacio para el banner fijo
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No hay mensajes aún</Text>
              <Text style={styles.emptySubtext}>¡Envía el primer mensaje!</Text>
            </View>
          )}
        />

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Escribe un mensaje..."
              multiline
            />
            {inputText.trim().length > 0 && (
              <Pressable style={styles.sendButton} onPress={sendMessage}>
                <Ionicons name="send" size={17} color="#7A33CC" />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7A33CC" translucent={false} />
      
      {/* Invite Modal */}
      {group && (
        <InviteModal
          visible={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          groupId={group.id}
        />
      )}
      
      {/* Header */}
      <View style={styles.header}>

        <Pressable 
          onPress={() => router.replace("/(tabs)/groups")} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{group.name || 'Grupo sin nombre'}</Text>
          <View style={styles.headerSubtitle}>
            <Text style={styles.headerSubtitleText}>
              {totalMembers} miembro{totalMembers !== 1 ? 's' : ''}
            </Text>
            {hasEnoughMembers && activeMembersCount > 0 && (
              <>
                <Text style={styles.headerDot}> • </Text>
                <View style={styles.activeIndicator} />
                <Text style={styles.headerSubtitleText}>
                  {activeMembersCount} activo{activeMembersCount !== 1 ? 's' : ''}
                </Text>
              </>
            )}
          </View>
        </View>

        <Pressable
          onPress={() => router.push(`/chat/chatInfo?groupId=${groupId}`)}
          style={styles.headerButton}
        >
          <Ionicons name="people" size={24} color="#FFFFFF" />
        </Pressable>
      </View>
        {/* Contenido principal */}
        {hasEnoughMembers ? renderChatScreen(group) : renderInvitationScreen(group)}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#7A33CC' },
  chatContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  muted: { color: '#888', marginTop: 8 },
  error: { color: '#c00' },

  header: {
    backgroundColor: '#7A33CC',
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: { marginRight: 12 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerButton: { marginLeft: 12 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: '600' },
  headerSubtitle: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  headerSubtitleText: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 14 },
  headerDot: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 14 },
  activeIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E', marginRight: 4 },

  // Invitación
  invitationContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, backgroundColor: '#FFFFFF'},
  invitationIcon: { marginBottom: 24 },
  invitationTitle: { fontSize: 24, fontWeight: 'bold', color: '#374151', textAlign: 'center', marginBottom: 8 },
  invitationSubtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  invitationButton: {
    backgroundColor: '#7A33CC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 16,
  },
  buttonIcon: { marginRight: 8 },
  invitationButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  invitationHelp: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },

  // Chat
  tripStatus: {
    backgroundColor: '#F3E8FF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: { marginRight: 8 },
  tripStatusInfo: { flex: 1 },
  tripStatusText: { color: '#7C3AED', fontSize: 14, fontWeight: '500' },
  showLocationsText: { color: '#7C3AED', fontSize: 12, marginTop: 2, textDecorationLine: 'underline' },

  messagesList: { flex: 1 },
  messagesContent: { paddingHorizontal: 16, paddingVertical: 16 },
  emptyMessagesContent: { flex: 1, justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#374151', marginTop: 12, fontWeight: '500' },
  emptySubtext: { fontSize: 14, color: '#6B7280', marginTop: 4 },

  // Mensajes
  arrivalContainer: { alignItems: 'center', marginVertical: 8 },
  arrivalBubble: { backgroundColor: '#BBF7D0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  arrivalText: { color: '#166534', fontSize: 14, fontWeight: '500' },
  arrivalTime: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  userMessageContainer: { alignItems: 'flex-end', marginVertical: 4 },
  userBubble: {
    backgroundColor: '#7A33CC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    maxWidth: '80%',
  },
  userMessageText: { color: 'white', fontSize: 14 },
  userMessageInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  checkIcon: { marginLeft: 4, color: '#9CA3AF' }, // Gris para no leído
  otherMessageContainer: { alignItems: 'flex-start', marginVertical: 4, maxWidth: '80%' },
  senderName: { color: '#374151', fontSize: 12, fontWeight: '500', marginBottom: 4 },
  otherBubble: { backgroundColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderBottomLeftRadius: 4 },
  otherMessageText: { color: '#374151', fontSize: 14 },
  messageTime: { color: '#6B7280', fontSize: 12, marginTop: 4 },

  inputContainer: { 
    paddingHorizontal: 16, 
    paddingVertical: 16,
    marginBottom: "7%",
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB' 
  },
  inputWrapper: {
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: { flex: 1, fontSize: 16, color: '#374151', minHeight: 20, maxHeight: 100 },
  sendButton: { marginLeft: 8, padding: 4 },
  
  // Check marks
  checkMarkContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  doubleCheck: { color: '#7A33CC' },
  secondCheck: { marginLeft: -8 }, // Superpone el segundo check

  // Journey Banner - Fijo arriba del chat
  journeyBannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  journeyBannerButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7A33CC',
    overflow: 'hidden',
  },
  journeyBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  journeyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  journeyTextContainer: {
    flex: 1,
  },
  journeyBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  journeyBannerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  journeyActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#7A33CC',
    borderRadius: 8,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
  },
});
