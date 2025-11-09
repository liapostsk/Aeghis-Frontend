import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Group } from '@/api/backend/group/groupType';
import { UserDto } from '@/api/backend/types';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { getGroupById } from '@/api/backend/group/groupApi';
import { sendMessageFirebase, listenGroupMessages, markAllMessagesAsRead} from '@/api/firebase/chat/chatService';
import { auth } from '@/firebaseconfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import InviteModal from '@/components/groups/InviteModal';
import { getCurrentJourneyForGroup } from '@/api/backend/journeys/journeyApi';
import { JourneyDto } from '@/api/backend/journeys/journeyType';
import { getParticipation } from '@/api/backend/participations/participationApi';
import { ParticipationDto } from '@/api/backend/participations/participationType';
import { getCurrentUser } from '@/api/backend/user/userApi';
import { SafeLocation, Location } from '@/api/backend/locations/locationType';
import SafeLocationModal from '@/components/safeLocations/SafeLocationModal';
import { 
  MessageBubble, 
  ChatHeader, 
  ChatInput, 
  EmptyChat, 
  InvitationScreen,
  JourneyBanner,
  JoinJourneyModal 
} from '@/components/chat';

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
  const [userParticipation, setUserParticipation] = useState<ParticipationDto | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserData, setCurrentUserData] = useState<UserDto | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<SafeLocation | null>(null);

  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  // Función para verificar si el usuario está participando en el trayecto
  const checkUserParticipation = async (journey: JourneyDto, userId: number): Promise<ParticipationDto | null> => {
    try {
      if (journey.participantsIds && journey.participantsIds.length > 0) {
        for (const participationId of journey.participantsIds) {
          try {
            const participation = await getParticipation(participationId);
            if (participation.userId === userId) {
              return participation;
            }
          } catch (error) {
            continue;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error checking user participation:', error);
      return null;
    }
  };

  // Manejar acción de unirse al trayecto
  const handleJoinJourney = () => {
    setShowJoinModal(true);
  };

  // Manejar éxito al unirse al trayecto
  const handleJoinSuccess = (participation: ParticipationDto) => {
    setUserParticipation(participation);
    setShowJoinModal(false);
    setSelectedDestination(null);
  };

  // Manejar selección de destino desde el modal
  const handleSelectDestination = (location: SafeLocation | Location) => {
    const safeLocation: SafeLocation = 'name' in location ? location : {
      id: location.id,
      name: `Ubicación personalizada`,
      address: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
      type: 'custom',
      latitude: location.latitude,
      longitude: location.longitude,
      externalId: undefined
    };
    setSelectedDestination(safeLocation);
    setShowDestinationModal(false);
  };

  const renderJourneyBanner = () => {
    if (!activeJourney) return null;
    
    return (
      <JourneyBanner 
        activeJourney={activeJourney}
        userParticipation={userParticipation}
        onJoinJourney={handleJoinJourney}
      />
    );
  };

  // Marcar mensajes como leídos al entrar al chat
  useEffect(() => {
    if (groupId) {
      markAllMessagesAsRead(String(groupId));
    }
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    const uid = auth.currentUser?.uid;

    const unsub = listenGroupMessages(
      String(groupId),
      (docs) => {
        const ui = docs.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          senderName: m.senderName || 'Unknown',
          content: m.content ?? '',
          time: (m.timestamp?.toDate ? m.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'enviando…'),
          isUser: m.senderId === uid,
          isRead: m.read || false,
          type: 'message' as const,
        }));
        setMessages(ui);
      },
      (err) => console.warn('Error leyendo mensajes:', err)
    );

    return unsub;
  }, [groupId]);

  // Cargar datos del grupo y usuario
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        setToken(token);

        const id = Number(groupId);
        if (!id || Number.isNaN(id)) {
          throw new Error('Invalid group id');
        }

        const [groupData, journeyData, userData] = await Promise.all([
          getGroupById(id),
          getCurrentJourneyForGroup(id).catch(() => null),
          getCurrentUser().catch(() => null)
        ]);
        
        if (mounted) {
          setGroup(groupData);
          setActiveJourney(journeyData);
          setCurrentUserId(userData?.id || null);
          setCurrentUserData(userData);
          setError(null);

          if (journeyData && userData) {
            const participation = await checkUserParticipation(journeyData, userData.id);
            setUserParticipation(participation);
          }
        }
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Unable to load group');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [groupId]);

  // Enviar mensaje
  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    setInputText('');
    try {
      await sendMessageFirebase(groupId, text);
    } catch (e) {
      console.warn('Error enviando mensaje', e);
    }
  };

  /** Guards */
  // Loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Cargando grupo…</Text>
      </View>
    );
  }
  // Error state
  if (error || !group) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? 'Group not found'}</Text>
      </View>
    );
  }

  // Datos del grupo
  const members = Array.isArray(group.membersIds) ? group.membersIds : [];
  const totalMembers = members.length;
  const hasEnoughMembers = totalMembers >= 2;
  const activeMembersCount = members.length;

  const renderChatScreen = () => {
    const hasActiveJourney = activeJourney && (activeJourney.state === 'PENDING' || activeJourney.state === 'IN_PROGRESS');
    const journeyBannerHeight = hasActiveJourney ? 92 : 0;

    return (
      <View style={styles.chatContainer}>
        {renderJourneyBanner()}

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              id={item.id}
              content={item.content}
              time={item.time}
              senderName={item.senderName}
              isUser={item.isUser || false}
              isRead={item.isRead}
              type={item.type}
            />
          )}
          style={styles.messagesList}
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 && styles.emptyMessagesContent,
            hasActiveJourney && { paddingTop: journeyBannerHeight + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={EmptyChat}
        />

        <ChatInput
          value={inputText}
          onChangeText={setInputText}
          onSend={sendMessage}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#7A33CC" translucent={false} />
      
      {/* Modales */}
      {group && (
        <InviteModal
          visible={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          groupId={group.id}
        />
      )}

      {activeJourney && (
        <JoinJourneyModal
          visible={showJoinModal}
          onClose={() => {
            setShowJoinModal(false);
            setSelectedDestination(null);
          }}
          journey={activeJourney}
          currentUser={currentUserData}
          onJoinSuccess={handleJoinSuccess}
          chatId={groupId}
        />
      )}

      <SafeLocationModal
        visible={showDestinationModal}
        onClose={() => setShowDestinationModal(false)}
        onSelectLocation={handleSelectDestination}
        title="Seleccionar tu destino"
        acceptLocationTypes="all"
      />
      
      {/* Header */}
      <ChatHeader
        groupName={group.name}
        groupId={group.id.toString()}
        totalMembers={totalMembers}
        activeMembersCount={activeMembersCount}
      />

      {/* Contenido */}
      {hasEnoughMembers ? renderChatScreen() : (
        <InvitationScreen
          groupType={group.type}
          onInvite={() => setShowInviteModal(true)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#7A33CC' },
  chatContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  muted: { color: '#888', marginTop: 8 },
  error: { color: '#c00' },

  messagesList: { flex: 1 },
  messagesContent: { paddingHorizontal: 16, paddingVertical: 16 },
  emptyMessagesContent: { flex: 1, justifyContent: 'center' },
});
