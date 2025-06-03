// File: components/groups/TrustedGroups.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

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

export default function TrustedGroups() {
  return (
    <View style={styles.container}>
      <Text style={styles.note}>This groups are permanent</Text>
      <FlatList
        data={trustedGroups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.initials}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.groupName}>{item.name}</Text>
              <Text style={styles.lastMessage}>{item.lastMessage}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
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
});
