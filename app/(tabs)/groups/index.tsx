import React, { useEffect, useMemo, useState,  } from 'react';
import type { Group } from '@/api/types';
import { getUserGroups } from '@/api/group/groupApi';
import { useGroupSeach } from './_layout'; // <- del Provider en groups/_layout
import { router } from 'expo-router';
import GroupsButton from '@/components/groups/GrupsButton';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { updateGroupFirebase } from '@/api/firebase/chat/chatService';

// Helpers
const getInitials = (name?: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase()).join('');
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
  const [loading, setLoading] = useState(false);

  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);


  const load = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      setToken(token);
      const data = await getUserGroups('CONFIANZA'); // <- tipo fijo para esta screen
      console.log("🧪 Grupos de confianza cargados:", data);
      setGroups(data ?? []);
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
            const lastMessage = "You: I'm arriving";
            const unreadCount = 1;
            const memberCount = item.membersIds?.length || 1;
            const status = stateLabel(item.state);
            return (
              <Pressable 
                style={styles.card} 
                onPress={() => navigateToChat(item)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.groupName}>{item.name}</Text>
                  <Text style={styles.lastMessage}>{lastMessage}</Text>
                  <Text style={styles.status}>{status}</Text>
                  <Text style={styles.memberCount}>
                      {memberCount} member{memberCount !== 1 ? 's' : ''}
                    </Text>
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
        />
      </View>

      <GroupsButton
        kind="confianza"
        onSuccess={load}
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
    marginBottom: 80,
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
});
