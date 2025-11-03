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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { Group } from '@/api/group/groupType';
import { UserDto } from '@/api/types';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { getGroupById } from '@/api/group/groupApi';
import { sendMessageFirebase, listenGroupMessages, markAllMessagesAsRead} from '@/api/firebase/chat/chatService';
import { auth } from '@/firebaseconfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import InviteModal from '@/components/groups/InviteModal';
import { getCurrentJourneyForGroup } from '@/api/journeys/journeyApi';
import { JourneyDto } from '@/api/journeys/journeyType';
import { getParticipation } from '@/api/participations/participationApi';
import { ParticipationDto } from '@/api/participations/participationType';
import { getCurrentUser } from '@/api/user/userApi';
import JourneyBanner from '@/components/chat/JourneyBanner';
import JoinJourneyModal from '@/components/chat/JoinJourneyModal';
import { SafeLocation, Location } from '@/api/locations/locationType';
import SafeLocationModal from '@/components/safeLocations/SafeLocationModal';

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

  function formatHourMin(d: Date) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Función para verificar si el usuario está participando en el trayecto
  const checkUserParticipation = async (journey: JourneyDto, userId: number): Promise<ParticipationDto | null> => {
    try {
      // Buscar si el usuario tiene una participación en este journey
      if (journey.participantsIds && journey.participantsIds.length > 0) {
        for (const participationId of journey.participantsIds) {
          try {
            const participation = await getParticipation(participationId);
            console.log('Checking participation:', participation);
            if (participation.userId === userId) {
              return participation;
            }
          } catch (error) {
            console.warn(`Error fetching participation ${participationId}:`, error);
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

  const handleJoinJourney = () => {
    setShowJoinModal(true);
  };

  const handleJoinSuccess = (participation: ParticipationDto) => {
    setUserParticipation(participation);
    setShowJoinModal(false);
    setSelectedDestination(null); // Limpiar destino seleccionado
    // Refrescar datos si es necesario
  };

  const handleRequestDestinationSelection = () => {
    console.log('🎯 Solicitando selección de destino...');
    setShowDestinationModal(true);
  };

  const handleSelectDestination = (location: SafeLocation | Location) => {
    // Convertir Location a SafeLocation si es necesario
    const safeLocation: SafeLocation = 'name' in location ? location : {
      id: location.id,
      name: `Ubicación personalizada`,
      address: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
      type: 'custom',
      latitude: location.latitude,
      longitude: location.longitude,
      externalId: undefined
    };
    console.log('📍 Destino seleccionado:', safeLocation);
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

  const unsub = listenGroupMessages(
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

        const [groupData, journeyData, userData] = await Promise.all([
          getGroupById(id),
          getCurrentJourneyForGroup(id).catch(() => null), // Si no hay journey, devolver null
          getCurrentUser().catch(() => null) // Obtener usuario actual
        ]);

        console.log('Loaded journey data:', journeyData);
        console.log('Loaded user data:', userData);
        
        if (mounted) {
          setGroup(groupData);
          setActiveJourney(journeyData);
          setCurrentUserId(userData?.id || null);
          setCurrentUserData(userData);
          setError(null);

          // Si hay journey y usuario, verificar participación
          if (journeyData && userData) {
            const participation = await checkUserParticipation(journeyData, userData.id);
            setUserParticipation(participation);
            console.log('User participation:', participation);
          }
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

      {/* Join Journey Modal */}
      {activeJourney && (
        <JoinJourneyModal
          visible={showJoinModal}
          onClose={() => {
            setShowJoinModal(false);
            setSelectedDestination(null); // Limpiar destino al cerrar
          }}
          journey={activeJourney}
          currentUser={currentUserData}
          onJoinSuccess={handleJoinSuccess}
          chatId={groupId}
        />
      )}

      {/* Destination Selection Modal */}
      <SafeLocationModal
        visible={showDestinationModal}
        onClose={() => {
          console.log('🚪 Cerrando modal de destino');
          setShowDestinationModal(false);
        }}
        onSelectLocation={handleSelectDestination}
        title="Seleccionar tu destino"
        acceptLocationTypes="all"
      />
      
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
});
