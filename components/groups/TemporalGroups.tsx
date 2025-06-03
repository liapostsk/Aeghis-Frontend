// File: components/groups/TemporalGroups.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const temporalGroups = [
  {
    id: '1',
    name: 'Return Safe Buddies',
    initials: 'RS',
    members: 3,
    status: 'On the way',
    subtitle: 'Terminate at arrival (Aprox. 15 min)',
    isEnded: false,
  },
  {
    id: '2',
    name: 'Girls night 💋',
    initials: 'GN',
    members: 5,
    status: 'Ended',
    subtitle: 'All arrive to their destinations',
    isEnded: true,
  },
];

export default function TemporalGroups() {
  return (
    <View style={styles.container}>
      <FlatList
        data={temporalGroups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, item.isEnded && styles.endedCard]}>
            <View style={[styles.avatar, item.isEnded && styles.endedAvatar]}>
              <Text style={styles.avatarText}>{item.initials}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.groupName}>{item.name}</Text>
              <Text style={styles.groupMeta}>{item.members} members · {item.status}</Text>
              <Text
                style={[
                  styles.groupSubtitle,
                  item.isEnded ? styles.subtitleEnded : styles.subtitleActive,
                ]}
              >
                {item.subtitle}
              </Text>
            </View>
            {item.isEnded ? (
              <Text style={styles.check}>✅</Text>
            ) : (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>1</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListFooterComponent={() => (
          <Text style={styles.footerText}>
            All the groups will be deleted 24h after finishing 🗑️
          </Text>
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
  endedCard: {
    backgroundColor: '#f6f0fa',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fce9a6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  endedAvatar: {
    backgroundColor: '#d5bdf5',
  },
  avatarText: {
    fontWeight: 'bold',
    color: '#333',
  },
  info: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  groupMeta: {
    fontSize: 13,
    color: '#666',
  },
  groupSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  subtitleActive: {
    color: '#28a745',
  },
  subtitleEnded: {
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#7A33CC',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  check: {
    fontSize: 20,
    marginLeft: 8,
  },
  footerText: {
    color: '#b00020',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
});
