import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface ChatHeaderProps {
  groupName: string;
  groupId: string;
  totalMembers: number;
  activeMembersCount?: number;
  onBack?: () => void;
}

export default function ChatHeader({
  groupName,
  groupId,
  totalMembers,
  activeMembersCount = 0,
  onBack,
}: ChatHeaderProps) {
  const hasEnoughMembers = totalMembers >= 2;

  return (
    <View style={styles.header}>
      <Pressable 
        onPress={onBack || (() => router.replace("/(tabs)/groups"))} 
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </Pressable>

      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>{groupName || 'Grupo sin nombre'}</Text>
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
  );
}

const styles = StyleSheet.create({
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
});
