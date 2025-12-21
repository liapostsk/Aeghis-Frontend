import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, Alert, Pressable, ScrollView } from 'react-native';
import { useTokenStore } from "@/lib/auth/tokenStore";
import { useUserStore } from "@/lib/storage/useUserStorage";
import { useAuth } from '@clerk/clerk-expo';
import { createGroup } from '@/api/backend/group/groupApi';
import { Group } from '@/api/backend/group/groupType';
import { createGroupFirebase } from '@/api/firebase/chat/chatService';
import { invalidateGroupsCache } from '@/lib/hooks/useUserGroups';
import { useTranslation } from 'react-i18next';

type Props = { 
    visible: boolean;
    onClose: () => void; 
    type?: 'CONFIANZA' | 'TEMPORAL' | 'COMPANION';
    onSuccess?: () => void;
};

export default function CreateGroupModal({ visible, onClose, onSuccess, type }: Props) {
  const { t } = useTranslation();
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, setUser } = useUserStore.getState();
  
  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);


  const getModalTitle = () => {
    switch (type) {
      case 'CONFIANZA': return t('createGroupModal.titles.confianza');
      case 'TEMPORAL': return t('createGroupModal.titles.temporal');
      case 'COMPANION': return t('createGroupModal.titles.companion');
      default: return t('createGroupModal.titles.default');
    }
  };

  const getModalDescription = () => {
    switch (type) {
      case 'CONFIANZA': return t('createGroupModal.descriptions.confianza');
      case 'TEMPORAL': return t('createGroupModal.descriptions.temporal');
      case 'COMPANION': return t('createGroupModal.descriptions.companion');
      default: return '';
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert(t('createGroupModal.alerts.error'), t('createGroupModal.alerts.nameRequired'));
      return;
    }
    
    const groupData: Partial<Group> = {
      name: groupName.trim(),
      description: description?.trim() || getModalDescription(),
      imageUrl: '',
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

      // ✅ Invalidar caché para que todos los componentes recarguen
      invalidateGroupsCache();
      console.log('🔄 Caché de grupos invalidado después de crear');

      if (onSuccess) {
        onSuccess();
      } else {
        onClose(); // Fallback si no hay onSuccess
      }

      setGroupName('');
      setDescription('');
      setLoading(false);
      
      Alert.alert(t('createGroupModal.alerts.success'), t('createGroupModal.alerts.groupCreated'));
      
    } catch (error) {
      console.error('❌ Error creating group:', error);
      Alert.alert(t('createGroupModal.alerts.error'), t('createGroupModal.alerts.createFailed'));
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
            <Text style={styles.label}>{t('createGroupModal.fields.groupName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('createGroupModal.fields.groupNamePlaceholder')}
              placeholderTextColor="#999"
              value={groupName}
              onChangeText={setGroupName}
              maxLength={50}
            />
            <Text style={styles.charCount}>{groupName.length}/50</Text>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('createGroupModal.fields.description')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('createGroupModal.fields.descriptionPlaceholder')}
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
              {type === 'CONFIANZA' && t('createGroupModal.infoBox.confianza')}
              {type === 'TEMPORAL' && t('createGroupModal.infoBox.temporal')}
              {type === 'COMPANION' && t('createGroupModal.infoBox.companion')}
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>{t('createGroupModal.buttons.cancel')}</Text>
          </Pressable>
          <Pressable style={styles.createButton} onPress={handleCreateGroup}>
            <Text style={styles.createButtonText}>{t('createGroupModal.buttons.create')}</Text>
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