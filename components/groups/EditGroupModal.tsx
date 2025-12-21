import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { editGroup, addPhotoToGroup } from '@/api/backend/group/groupApi';
import { Group } from '@/api/backend/group/groupType';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { uploadGroupPhotoAsync, deleteGroupPhoto } from '@/api/firebase/storage/photoService';
import { useTranslation } from 'react-i18next';

interface EditGroupModalProps {
    visible: boolean;
    onClose: () => void;
    group: Group;
    onGroupUpdated: (updatedGroup: Group) => void;
}

export default function EditGroupModal({ 
  visible, 
  onClose, 
  group,
  onGroupUpdated
}: EditGroupModalProps) {
    const { t } = useTranslation();
    const [name, setName] = useState(group.name);
    const [description, setDescription] = useState(group.description || '');
    const [imageUri, setImageUri] = useState<string | undefined>(group.imageUrl);
    const [imageLoading, setImageLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const { getToken } = useAuth();
    const setToken = useTokenStore((state) => state.setToken);

    useEffect(() => {
        setName(group.name);
        setDescription(group.description || '');
        setImageUri(group.imageUrl);
    }, [group]);

    const handleClose = () => {
        setName(group.name);
        setDescription(group.description || '');
        setImageUri(group.imageUrl);
        onClose();
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert(t('editGroupModal.alerts.error'), t('editGroupModal.alerts.nameEmpty'));
            return;
        }
        
        setSaving(true);
        
        try {
            const updateData: Partial<Group> = {
                name: name.trim(),
                description: description.trim() || undefined,
                lastModified: new Date()
            };

            const token = await getToken();
            setToken(token);
            
            const updatedGroup = await editGroup(group.id, updateData);
            onGroupUpdated({ ...updatedGroup, imageUrl: imageUri });
            onClose();
            
            Alert.alert(t('editGroupModal.alerts.success'), t('editGroupModal.alerts.groupUpdated'));
        } catch (error) {
            console.error('Error:', error);
            Alert.alert(t('editGroupModal.alerts.error'), t('editGroupModal.alerts.updateFailed'));
        } finally {
            setSaving(false);
        }
    };

    const showImageOptions = () => {
        const options = imageUri 
            ? [t('editGroupModal.photo.change'), t('editGroupModal.photo.delete'), t('editGroupModal.buttons.cancel')]
            : [t('editGroupModal.photo.select'), t('editGroupModal.buttons.cancel')];
        
        const destructiveButtonIndex = imageUri ? 1 : undefined;
        const cancelButtonIndex = imageUri ? 2 : 1;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                { options, cancelButtonIndex, destructiveButtonIndex },
                async (buttonIndex) => {
                    if (buttonIndex === 0) await handleChangePhoto();
                    else if (buttonIndex === 1 && imageUri) await handleDeletePhoto();
                }
            );
        } else {
            if (imageUri) {
                Alert.alert(t('editGroupModal.photo.actionTitle'), t('editGroupModal.photo.actionMessage'), [
                    { text: t('editGroupModal.photo.change'), onPress: handleChangePhoto },
                    { text: t('editGroupModal.photo.delete'), onPress: handleDeletePhoto, style: 'destructive' },
                    { text: t('editGroupModal.buttons.cancel'), style: 'cancel' },
                ]);
            } else {
                handleChangePhoto();
            }
        }
    };

    const handleChangePhoto = async () => {
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
                setImageLoading(true);

                try {
                    if (imageUri) await deleteGroupPhoto(imageUri);

                    const downloadURL = await uploadGroupPhotoAsync(
                        result.assets[0].uri,
                        group.id
                    );

                    const token = await getToken();
                    setToken(token);
                    await addPhotoToGroup(group.id, downloadURL);

                    setImageUri(downloadURL);
                    onGroupUpdated({ ...group, imageUrl: downloadURL });
                    
                    Alert.alert(t('editGroupModal.alerts.success'), t('editGroupModal.alerts.photoUpdated'));
                } catch (error) {
                    console.error('Error:', error);
                    Alert.alert(t('editGroupModal.alerts.error'), t('editGroupModal.alerts.photoUpdateFailed'));
                } finally {
                    setImageLoading(false);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            Alert.alert(t('editGroupModal.alerts.error'), t('editGroupModal.alerts.selectFailed'));
        }
    };

    const handleDeletePhoto = async () => {
        Alert.alert(t('editGroupModal.photo.deleteTitle'), t('editGroupModal.photo.deleteConfirm'), [
            { text: t('editGroupModal.buttons.cancel'), style: 'cancel' },
            {
                text: t('editGroupModal.photo.delete'),
                style: 'destructive',
                onPress: async () => {
                    try {
                        setImageLoading(true);

                        if (imageUri) await deleteGroupPhoto(imageUri);

                        const token = await getToken();
                        setToken(token);
                        await addPhotoToGroup(group.id, '');

                        setImageUri(undefined);
                        onGroupUpdated({ ...group, imageUrl: undefined });
                        
                        Alert.alert(t('editGroupModal.alerts.success'), t('editGroupModal.alerts.photoDeleted'));
                    } catch (error) {
                        console.error('Error:', error);
                        Alert.alert(t('editGroupModal.alerts.error'), t('editGroupModal.alerts.photoDeleteFailed'));
                    } finally {
                        setImageLoading(false);
                    }
                },
            },
        ]);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Pressable onPress={handleClose}>
                        <Text style={styles.cancelText}>Cancelar</Text>
                    </Pressable>
                    <Text style={styles.modalTitle}>Editar grupo</Text>
                    <Pressable onPress={handleSave} disabled={saving || imageLoading}>
                        {saving ? (
                            <ActivityIndicator size="small" color="#007AFF" />
                        ) : (
                            <Text style={styles.saveText}>OK</Text>
                        )}
                    </Pressable>
                </View>

                <View style={styles.modalContent}>
                    <Pressable style={styles.imageContainer} onPress={showImageOptions} disabled={imageLoading}>
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
                            {imageLoading ? 'Subiendo...' : imageUri ? 'Cambiar foto' : 'Añadir foto'}
                        </Text>
                    </Pressable>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>{t('editGroupModal.fields.groupName')}</Text>
                        <TextInput
                            style={styles.titleInput}
                            value={name}
                            onChangeText={setName}
                            placeholder={t('editGroupModal.fields.namePlaceholder')}
                            maxLength={50}
                            autoCapitalize="words"
                        />
                    </View>
                    
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>{t('editGroupModal.fields.groupDescription')}</Text>
                        <TextInput
                            style={styles.titleInput}
                            value={description}
                            onChangeText={setDescription}
                            placeholder={t('editGroupModal.fields.descriptionPlaceholder')}
                            maxLength={100}
                            autoCapitalize="sentences"
                            onSubmitEditing={handleSave}
                            multiline
                            numberOfLines={3}
                        />
                    </View>
                </View>
            </SafeAreaView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  saveText: {
    fontSize: 16,
    color: '#7A33CC',
    fontWeight: '600',
  },
  modalContent: {
    padding: 24,
    alignItems: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 32,
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
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
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
});
