import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


interface GroupActionsProps {
  groupId: number;
  onStartJourney: () => void;
  hasActiveJourney: boolean;
}

export default function GroupActions({ groupId, onStartJourney, hasActiveJourney }: GroupActionsProps) {
  return (
    <View style={styles.actionsContainer}>
      <Pressable
        style={[styles.actionButton, hasActiveJourney && { opacity: 0.5 }]}
        onPress={onStartJourney}
        disabled={hasActiveJourney}
      >
        <Ionicons name="location-outline" size={20} color="#7A33CC" />
        <Text style={styles.actionButtonText}>Empezar trayecto</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A33CC',
  },
});
