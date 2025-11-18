import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { getUserGroupsByType } from '@/api/backend/group/groupApi';
import { getGroupTilesInfo, markChatSeen } from '@/api/firebase/chat/chatService';
import { GroupTileInfo } from '@/api/firebase/types';
import { auth } from '@/firebaseconfig';
import { Group } from '@/api/backend/group/groupType';
import { useGroupSeach } from '@/app/(tabs)/groups/_layout';
import { Ionicons } from '@expo/vector-icons';

// Helpers
const getInitials = (name?: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase()).join('');
};

const formatTime = (ts?: any) => {
  if (!ts?.toDate) return '';
  const d: Date = ts.toDate();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const stateLabel = (state?: string) => {
  switch (state) {
    case 'ACTIVO': return 'Active';
    case 'INACTIVO': return 'Inactive';
    case 'CERRADO': return 'Closed';
    case 'PENDIENTE': return 'Pending';
    default: return state ?? '';
  }
};

type Props = {
  groupType: 'CONFIANZA' | 'TEMPORAL';
  emptyTitle: string;
  emptySubtitle: string;
  noteText: string;
};

export default function GroupsList({ groupType, emptyTitle, emptySubtitle, noteText }: Props) {
  const { search } = useGroupSeach();
  const [groups, setGroups] = useState<Group[]>([]);
  const [tilesById, setTilesById] = useState<Record<string, GroupTileInfo>>({});
  const [loading, setLoading] = useState(false);

  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  const load = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      setToken(token);
      const data = await getUserGroupsByType(groupType);
      setGroups(data ?? []);
      console.log(`🧪 Grupos ${groupType} cargados:`, data);
      
      if (data && data.length) {
        const ids = data.map(g => String(g.id));
        try {
          const tiles = await getGroupTilesInfo(ids);
          const map: Record<string, GroupTileInfo> = {};
          for (const t of tiles) {
            if (t) map[t.chatId] = t;
          }
          setTilesById(map);
        } catch (e) {
          console.warn('No se pudo cargar tiles de Firestore:', e);
          setTilesById({});
        }
      } else {
        setTilesById({});
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [groupType]);

  // Filtrado local por el search del header
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(g =>
      (g.name ?? '').toLowerCase().includes(q)
    );
  }, [groups, search]);

  const navigateToChat = (group: Group) => {
    console.log("Info del grupo seleccionado:", group);
    //updateGroupFirebase(group);
    void markChatSeen(String(group.id)).catch(() => {});
    router.push({
      pathname: '/chat',
      params: {
        groupId: group.id.toString()
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.note}>{noteText}</Text>
      
      <View style={styles.listContainer}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={!!loading} onRefresh={load ?? (() => {})} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{emptyTitle}</Text>
              <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const initials = getInitials(item.name);
            const memberCount = item.membersIds?.length || 1;
            const status = stateLabel(item.state);
            const tile = tilesById[String(item.id)];
            
            // Debug temporal para identificar el problema
            console.log(`Tile para grupo ${item.id}:`, tile);
            
            // Verificación robusta del mensaje
            const lastMessage = (() => {
              if (!tile || !tile.lastMessage) return 'No messages yet';
              
              const senderPrefix = tile.lastSenderId === auth.currentUser?.uid 
                ? 'Yo: '
                : tile.lastSenderName 
                  ? `${tile.lastSenderName}: `
                  : '';
              
              const maxMessageLength = 35;
              const truncatedMessage = tile.lastMessage.length > maxMessageLength 
                ? tile.lastMessage.substring(0, maxMessageLength) + '...' 
                : tile.lastMessage;
              
              return `${senderPrefix}${truncatedMessage}`;
            })();
            
            const lastTime = tile?.lastMessageAt ? formatTime(tile.lastMessageAt) : '';
            const unreadCount = tile?.unreadCount ?? 0;

            return (
              <Pressable 
                style={styles.card} 
                onPress={() => navigateToChat(item)}
              >
                {/* Avatar/Imagen del grupo */}
                {item.imageUrl ? (
                  <Image 
                    source={{ uri: item.imageUrl }} 
                    style={styles.groupImage}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Ionicons name="people" size={24} color="#7A33CC" />
                  </View>
                )}
                <View style={styles.info}>
                  <View style={styles.topRow}>
                    <Text style={styles.groupName}>{item.name}</Text>
                    {lastTime && (
                      <Text style={styles.timeText}>{lastTime}</Text>
                    )}
                  </View>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {lastMessage}
                  </Text>
                  <View style={styles.bottomRow}>
                    <Text style={styles.status}>{status}</Text>
                    <Text style={styles.memberCount}>
                      {memberCount} member{memberCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{unreadCount}</Text>
                  </View>
                )}
              </Pressable>
            );
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listContainer: {
    flex: 1,
  },
  note: {
    fontSize: 17,
    color: '#888',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 1,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 1 },
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5d9f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#7A33CC',
  },
  avatarText: {
    color: '#7A33CC',
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 14,
    color: '#444',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  status: {
    fontSize: 13,
    color: '#28a745',
  },
  memberCount: {
    fontSize: 12,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#7A33CC',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  empty: { 
    paddingVertical: 40, 
    alignItems: 'center' 
  },
  emptyTitle: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    color: '#333' 
  },
  emptySubtitle: { 
    color: '#777', 
    marginTop: 4 
  },
  listContent: {
    paddingBottom: 80,
  },
});