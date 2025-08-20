// File: components/groups/GroupActionModal.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GroupActionModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateGroup: () => void;
  onJoinGroup: () => void;
}

export default function GroupActionModal({ 
  visible, 
  onClose, 
  onCreateGroup, 
  onJoinGroup 
}: GroupActionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>What would you like to do?</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {/* Create Group Option */}
            <Pressable style={styles.option} onPress={onCreateGroup}>
              <View style={[styles.iconContainer, styles.createIcon]}>
                <Ionicons name="add-circle" size={32} color="#7A33CC" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Create New Group</Text>
                <Text style={styles.optionDescription}>
                  Start a new group and invite your friends
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Pressable>

            {/* Join Group Option */}
            <Pressable style={styles.option} onPress={onJoinGroup}>
              <View style={[styles.iconContainer, styles.joinIcon]}>
                <Ionicons name="log-in" size={32} color="#F5C80E" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Join with Code</Text>
                <Text style={styles.optionDescription}>
                  Enter an 8-digit code to join an existing group
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  createIcon: {
    backgroundColor: '#F8F4FF',
  },
  joinIcon: {
    backgroundColor: '#FFFCF0',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
});