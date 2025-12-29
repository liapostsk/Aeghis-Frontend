import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { View, Text, TextInput, Modal, StyleSheet, Alert, Pressable, ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useTokenStore } from "@/lib/auth/tokenStore";
import { useUserStore } from "@/lib/storage/useUserStorage";
import { useAuth } from '@clerk/clerk-expo';
import { createGroup } from '@/api/backend/group/groupApi';
import { Group } from '@/api/backend/group/groupType';
import { createGroupFirebase } from '@/api/firebase/chat/chatService';
import { invalidateGroupsCache } from '@/lib/hooks/useUserGroups';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { uploadGroupPhotoAsync } from '@/api/firebase/storage/photoService';
import { addPhotoToGroup } from '@/api/backend/group/groupApi';

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
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const [imageLoading, setImageLoading] = useState(false);

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

  const handleSelectPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('editGroupModal.alerts.permissionRequired'), t('editGroupModal.alerts.permissionMessage'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert(t('editGroupModal.alerts.error'), t('editGroupModal.alerts.selectFailed'));
    }
  };

  const handleRemovePhoto = () => {
    setImageUri(undefined);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert(t('createGroupModal.alerts.error'), t('createGroupModal.alerts.nameRequired'));
      return;
    }
    
    try {
      setLoading(true);

      const token = await getToken();
      setToken(token);

      let uploadedImageUrl = '';

      if (imageUri) {
        try {
          setImageLoading(true);
          console.log('Subiendo imagen del grupo a Firebase...');
          
          const groupData: Partial<Group> = {
            name: groupName.trim(),
            description: description?.trim() || getModalDescription(),
            imageUrl: '',
            type: type || 'CONFIANZA',
            ownerId: user?.id
          };

          const idGroup = await createGroup(groupData);
          console.log('Grupo creado con ID:', idGroup);

          uploadedImageUrl = await uploadGroupPhotoAsync(imageUri, idGroup);
          console.log('Imagen subida exitosamente:', uploadedImageUrl);

          await addPhotoToGroup(idGroup, uploadedImageUrl);
          console.log('Foto sincronizada con el backend');

          groupData.id = idGroup;
          groupData.imageUrl = uploadedImageUrl;

          const chatId = await createGroupFirebase(groupData);
          console.log('Firebase group chat initialized with ID:', chatId);

          invalidateGroupsCache();
          console.log('Cache de grupos invalidado');

          if (onSuccess) {
            onSuccess();
          } else {
            onClose();
          }

          setGroupName('');
          setDescription('');
          setImageUri(undefined);
          setLoading(false);
          setImageLoading(false);
          
          Alert.alert(t('createGroupModal.alerts.success'), t('createGroupModal.alerts.groupCreated'));
          return;

        } catch (uploadError) {
          console.error('Error subiendo imagen:', uploadError);
          setImageLoading(false);
        }
      }

      const groupData: Partial<Group> = {
        name: groupName.trim(),
        description: description?.trim() || getModalDescription(),
        imageUrl: uploadedImageUrl,
        type: type || 'CONFIANZA',
        ownerId: user?.id
      };

      console.log('Creating group with data:', groupData);
      
      const idGroup = await createGroup(groupData);
      console.log('Group created successfully with ID:', idGroup);

      groupData.id = idGroup;

      const chatId = await createGroupFirebase(groupData);
      console.log('Firebase group chat initialized with ID:', chatId);

      invalidateGroupsCache();
      console.log('Cache de grupos invalidado');

      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }

      setGroupName('');
      setDescription('');
      setImageUri(undefined);
      setLoading(false);
      
      Alert.alert(t('createGroupModal.alerts.success'), t('createGroupModal.alerts.groupCreated'));
      
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert(t('createGroupModal.alerts.error'), t('createGroupModal.alerts.createFailed'));
      setLoading(false);
      setImageLoading(false);
    }
  } 

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
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

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Group Photo */}
          <Pressable 
            style={styles.imageContainer} 
            onPress={handleSelectPhoto} 
            disabled={imageLoading}
          >
            {imageLoading ? (
              <View style={styles.groupImage}>
                <ActivityIndicator size="large" color="#7A33CC" />
              </View>
            ) : imageUri ? (
              <View style={styles.imageWrapper}>
                <Image source={{ uri: imageUri }} style={styles.groupImage} />
                <View style={styles.cameraIconOverlay}>
                  <Ionicons name="camera" size={18} color="#FFFFFF" />
                </View>
                <Pressable 
                  style={styles.removeImageButton}
                  onPress={handleRemovePhoto}
                >
                  <Ionicons name="close-circle" size={24} color="#FF4444" />
                </Pressable>
              </View>
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="people" size={60} color="#9CA3AF" />
                <View style={styles.cameraIconOverlay}>
                  <Ionicons name="camera" size={18} color="#FFFFFF" />
                </View>
              </View>
            )}
            <Text style={styles.imageText}>
              {imageLoading ? t('editGroupModal.photo.uploading') : imageUri ? t('editGroupModal.photo.change') : t('editGroupModal.photo.add')}
            </Text>
          </Pressable>

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
          <Pressable style={styles.cancelButton} onPress={onClose} disabled={loading || imageLoading}>
            <Text style={styles.cancelButtonText}>{t('createGroupModal.buttons.cancel')}</Text>
          </Pressable>
          <Pressable 
            style={[styles.createButton, (loading || imageLoading) && styles.createButtonDisabled]} 
            onPress={handleCreateGroup}
            disabled={loading || imageLoading}
          >
            {loading || imageLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>{t('createGroupModal.buttons.create')}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  scrollContent: {
    paddingBottom: 20,
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
  createButtonDisabled: {
    backgroundColor: '#C4B5FD',
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  groupImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  imageText: {
    fontSize: 14,
    color: '#7A33CC',
    fontWeight: '500',
  },
  imageWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#7A33CC',
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: 'white',
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 12,
  },
});