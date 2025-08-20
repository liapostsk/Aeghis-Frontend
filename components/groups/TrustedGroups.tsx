// File: components/groups/TrustedGroups.tsx
import { Group } from '@/api/types'; 
import { router } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';

type trustedProps = { 
  groups: Group[];
  loading?: boolean;
  onRefresh?: () => void; 
};

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

const trustedGroups = [
  {
    id: '1',
    name: 'Home family',
    initials: 'HF',
    lastMessage: 'Last message: 5 min ago',
    status: 'Sharing your current location',
    unreadCount: 4,
  },
  {
    id: '2',
    name: 'Best Friends',
    initials: 'BF',
    lastMessage: "You: I'm arriving",
    status: 'Yesterday',
    unreadCount: 0,
  },
];

export default function TrustedGroups({groups, loading, onRefresh}: trustedProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.note}>This groups are permanent</Text>
      <FlatList
        data={groups}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={!!loading} onRefresh={onRefresh ?? (() => {})} />
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
          const status = stateLabel(item.state);
          return (
            <Pressable style={styles.card} onPress={() => router.push("/chat")}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.lastMessage}>{lastMessage}</Text>
                <Text style={styles.status}>{status}</Text>
              </View>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{unreadCount}</Text>
                </View>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
});
