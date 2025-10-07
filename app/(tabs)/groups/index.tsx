import React, { useEffect, useMemo, useState,  } from 'react';
import type { Group } from '@/api/types';
import { getUserGroups } from '@/api/group/groupApi';
import { useGroupSeach } from './_layout'; // <- del Provider en groups/_layout
import { router } from 'expo-router';
import GroupsButton from '@/components/groups/GrupsButton';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { getGroupTilesInfo, updateGroupFirebase, markChatSeen} from '@/api/firebase/chat/chatService';
import { GroupTileInfo } from '@/api/firebase/firebaseTypes';
import { auth } from '@/firebaseconfig';

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

export default function TrustedScreen() {
  const { search } = useGroupSeach();        // valor compartido del header
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
      const data = await getUserGroups('CONFIANZA'); // <- tipo fijo para esta screen
      setGroups(data ?? []);
      console.log("🧪 Grupos de confianza cargados:", data);
      if (data && data.length) {
        const ids = data.map(g => String(g.id));
        try {
          const tiles = await getGroupTilesInfo(ids);
          const map: Record<string, GroupTileInfo> = {};
          for (const t of tiles) {
            if (t) map[t.chatId] = t; // por si has filtrado errores inside
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

  useEffect(() => { load(); }, []);

  // Filtrado local por el search del header
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(g =>
      (g.name ?? '').toLowerCase().includes(q)
      // añade otros campos si te interesa buscar por más cosas
    );
  }, [groups, search]);

  const navigateToChat = (group: Group) => {
    updateGroupFirebase(group); // Actualiza datos del chat al entrar
    void markChatSeen(String(group.id)).catch(() => {}); // Marca como visto
    router.push({
      pathname: '/chat',
      params: {
        groupId: group.id.toString()
      }
    })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.note}>This groups are permanent</Text>
      
      <View style={styles.listContainer}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={!!loading} onRefresh={load ?? (() => {})} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No trusted groups yet</Text>
              <Text style={styles.emptySubtitle}>Create one with the + button</Text>
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
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
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
        <GroupsButton
          kind="confianza"
          onSuccess={load}
          style={styles.fab}
        />
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
  avatarText: {
    color: '#7A33CC',
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
    marginRight: 8, // Espacio para el badge de notificación
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 14,
    color: '#444',
  },
  status: {
    fontSize: 13,
    color: '#28a745',
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
  memberCount: {
    fontSize: 12,
    color: '#666',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 70,
    right: 20,
    elevation: 8, // Android
    shadowColor: '#000', // iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },
});
