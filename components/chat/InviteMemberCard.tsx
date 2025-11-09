import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InviteMemberCardProps {
  onPress: () => void;
}

export default function InviteMemberCard({ onPress }: InviteMemberCardProps) {
  return (
    <Pressable style={styles.inviteMemberCard} onPress={onPress}>
      <View style={styles.inviteMemberAvatar}>
        <Ionicons name="share-outline" size={20} color="#7A33CC" />
      </View>
      <View style={styles.inviteMemberInfo}>
        <Text style={styles.inviteMemberText}>Invitar miembros</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inviteMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inviteMemberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#7A33CC',
    borderStyle: 'dashed',
  },
  inviteMemberInfo: { flex: 1 },
  inviteMemberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A33CC',
  },
});
