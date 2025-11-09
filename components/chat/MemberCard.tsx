import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserDto } from '@/api/backend/types';

interface MemberCardProps {
  user: UserDto;
  isCurrentUser: boolean;
  role: 'admin' | 'member';
  isOnline: boolean;
  lastSeen?: Date;
  isCurrentUserAdmin: boolean;
  onPromote?: () => void;
  onDemote?: () => void;
  onRemove?: () => void;
}

export default function MemberCard({
  user,
  isCurrentUser,
  role,
  isOnline,
  lastSeen,
  isCurrentUserAdmin,
  onPromote,
  onDemote,
  onRemove,
}: MemberCardProps) {
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  const displayName = isCurrentUser ? 'Tú' : user.name;

  return (
    <View style={styles.memberCard}>
      {/* Avatar */}
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>{initials}</Text>
        <View style={[
          styles.statusIndicator,
          isOnline ? styles.onlineIndicator : styles.offlineIndicator
        ]} />
      </View>

      {/* Info */}
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{displayName}</Text>
        <Text style={styles.memberPhone}>{user.phone}</Text>
        <View style={styles.memberMeta}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {role === 'admin' ? 'Administrador' : 'Miembro'}
            </Text>
          </View>
          <Text style={[styles.memberDate, !isOnline && styles.offlineText]}>
            {isOnline ? 'En línea' : lastSeen ? `Visto ${lastSeen.toLocaleDateString()}` : 'Desconectado'}
          </Text>
        </View>
      </View>

      {/* Admin Actions */}
      {isCurrentUserAdmin && !isCurrentUser && (
        <View style={styles.adminActions}>
          {role === 'member' ? (
            <Pressable
              onPress={onPromote}
              style={styles.adminButton}
            >
              <Ionicons name="shield" size={16} color="#7A33CC" />
            </Pressable>
          ) : (
            <Pressable
              onPress={onDemote}
              style={[styles.adminButton, styles.warningButton]}
            >
              <Ionicons name="shield-outline" size={16} color="#F59E0B" />
            </Pressable>
          )}
          <Pressable
            onPress={onRemove}
            style={[styles.adminButton, styles.dangerButton]}
          >
            <Ionicons name="trash" size={16} color="#EF4444" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  memberCard: {
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
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7A33CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  memberAvatarText: { color: 'white', fontWeight: '700', fontSize: 12 },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: 'white',
  },
  onlineIndicator: { backgroundColor: '#22C55E' },
  offlineIndicator: { backgroundColor: '#EF4444' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  memberPhone: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  memberMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  roleBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '600', color: '#7A33CC' },
  memberDate: { fontSize: 11, color: '#9CA3AF' },
  offlineText: { color: '#EF4444' },
  adminActions: { flexDirection: 'row', gap: 8, marginLeft: 8 },
  adminButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButton: { backgroundColor: '#FEF2F2' },
  warningButton: { backgroundColor: '#FFFBEB' },
});
