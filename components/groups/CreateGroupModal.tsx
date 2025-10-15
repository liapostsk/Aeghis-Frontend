import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, Alert, Pressable, ScrollView } from 'react-native';
import { useTokenStore } from "@/lib/auth/tokenStore";
import { useUserStore } from "@/lib/storage/useUserStorage";
import { useAuth } from '@clerk/clerk-expo';
import { createGroup } from '@/api/group/groupApi';
import { Group } from '@/api/types';
import { createGroupFirebase } from '@/api/firebase/chat/chatService';


type Props = { 
    visible: boolean;
    onClose: () => void; 
    type?: 'CONFIANZA' | 'TEMPORAL' | 'COMPANION';
    onSuccess?: () => void;
};

export default function CreateGroupModal({ visible, onClose, onSuccess, type }: Props) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState<{ code: string; deepLink: string } | null>(null);

  const { user, setUser } = useUserStore.getState();
  
  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);


  const getModalTitle = () => {
    switch (type) {
      case 'CONFIANZA': return 'Create Trusted Group';
      case 'TEMPORAL': return 'Create TEMPORAL Group';
      case 'COMPANION': return 'Create COMPANION Group';
      default: return 'Create Group';
    }
  };

  const getModalDescription = () => {
    switch (type) {
      case 'CONFIANZA': return 'A secure group for close friends and family';
      case 'TEMPORAL': return 'A temporary group that expires after a set time';
      case 'COMPANION': return 'A group for finding COMPANIONs and activities';
      default: return '';
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }
    
    const groupData: Partial<Group> = {
      name: groupName.trim(),
      description: description?.trim() || getModalDescription(),
      image: '',
      type: type || 'CONFIANZA',  // Usar el prop type o por defecto 'CONFIANZA'
      ownerId: user?.id
    };

    console.log('Creating group with data:', groupData);
    
    try {
      setLoading(true);

      const token = await getToken();
      setToken(token);
      
      const idGroup = await createGroup(groupData);
      
      console.log('Group created successfully with ID:', idGroup);

      groupData.id = idGroup;

      // Inicializar chat en Firebase
      const chatId = await createGroupFirebase(groupData);
      console.log('Firebase group chat initialized with ID:', chatId);

      if (onSuccess) {
        onSuccess();
      } else {
        onClose(); // Fallback si no hay onSuccess
      }

      setGroupName('');
      setDescription('');
      setLoading(false);
      
      Alert.alert('Success', 'Group created successfully!');
      
    } catch (error) {
      console.error('❌ Error creating group:', error);
      Alert.alert('Error', 'Failed to create group');
      setLoading(false);
    }
  } 

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#7A33CC" />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{getModalTitle()}</Text>
            <Text style={styles.headerSubtitle}>{getModalDescription()}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Group Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Group Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter group name"
              placeholderTextColor="#999"
              value={groupName}
              onChangeText={setGroupName}
              maxLength={50}
            />
            <Text style={styles.charCount}>{groupName.length}/50</Text>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What's this group about?"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            <Text style={styles.charCount}>{description.length}/200</Text>
          </View>

          {/* Group Type Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#7A33CC" />
            <Text style={styles.infoText}>
              {type === 'CONFIANZA' && 'Trusted groups have enhanced security features and are perfect for family and close friends.'}
              {type === 'TEMPORAL' && 'TEMPORAL groups are automatically deleted after the specified duration.'}
              {type === 'COMPANION' && 'COMPANION groups help you find people with similar interests and activities.'}
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.createButton} onPress={handleCreateGroup}>
            <Text style={styles.createButtonText}>Create Group</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#7A33CC',
    marginTop: 4,
    fontStyle: 'italic',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F4FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#7A33CC',
    marginLeft: 8,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  createButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#7A33CC',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});