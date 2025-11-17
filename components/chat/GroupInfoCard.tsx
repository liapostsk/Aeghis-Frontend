import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Group } from '@/api/backend/group/groupType';

interface GroupInfoCardProps {
  group: Group;
  membersCount: number;
  onlineCount: number;
  adminsCount: number;
  onEdit: () => void;
}

export default function GroupInfoCard({
  group,
  membersCount,
  onlineCount,
  adminsCount,
  onEdit,
}: GroupInfoCardProps) {
  return (
    <View style={styles.groupCard}>
      <View style={styles.groupHeader}>
        {/* Imagen del grupo */}
        {group.image ? (
          <Image 
            source={{ uri: group.image }} 
            style={styles.groupImage}
          />
        ) : (
          <View style={styles.groupIcon}>
            <Ionicons name="people" size={40} color="#7A33CC" />
          </View>
        )}
        <View style={styles.groupDetails}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupType}>
            {group.type?.charAt(0).toUpperCase() + group.type?.slice(1).toLowerCase()}
          </Text>
          <Text style={styles.groupMembers}>
            {membersCount} miembro{membersCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <Pressable style={styles.editButton} onPress={onEdit}>
          <Text style={styles.editButtonText}>Editar</Text>
        </Pressable>
      </View>

      {group.description && (
        <Text style={styles.groupDescription}>{group.description}</Text>
      )}

      <View style={styles.groupStats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{membersCount}</Text>
          <Text style={styles.statLabel}>Participantes</Text>
        </View>
        <View style={[styles.stat, styles.statBorder]}>
          <Text style={styles.statValue}>{onlineCount}</Text>
          <Text style={styles.statLabel}>En línea</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{adminsCount}</Text>
          <Text style={styles.statLabel}>Administradores</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  groupCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  groupIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#7A33CC',
  },
  groupDetails: { flex: 1 },
  groupName: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  groupType: { fontSize: 14, color: '#7A33CC', fontWeight: '500', marginTop: 2 },
  groupMembers: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  groupDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  groupStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  stat: { alignItems: 'center', flex: 1 },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E5E7EB' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#7A33CC' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  editButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  editButtonText: {
    fontSize: 14,
    color: '#7A33CC',
    fontWeight: '600',
  },
});
