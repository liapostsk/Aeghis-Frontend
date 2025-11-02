import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Group } from '@/api/group/groupType';
import { UserDto } from '@/api/types';

interface GroupBannerProps {
  group: Group | null;
  members: UserDto[];
}

export default function GroupBanner({ group, members }: GroupBannerProps) {
  if (!group) return null;

  return (
    <View style={styles.groupBanner}>
      <View style={styles.groupBannerIcon}>
        <Ionicons name="people" size={24} color="#7A33CC" />
      </View>
      <View style={styles.groupBannerInfo}>
        <Text style={styles.groupBannerTitle}>{group.name}</Text>
        <Text style={styles.groupBannerSubtitle}>
          {members.length} miembro{members.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  groupBanner: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    // Sombra sutil
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  groupBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupBannerInfo: { 
    flex: 1,
  },
  groupBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  groupBannerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});