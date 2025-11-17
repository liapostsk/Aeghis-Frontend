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
import { editGroup } from '@/api/backend/group/groupApi';
import { Group } from '@/api/backend/group/groupType';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { uploadGroupPhotoAsync, deleteGroupPhoto } from '@/api/firebase/storage/photoService';

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
    const [name, setName] = useState(group.name);
    const [description, setDescription] = useState(group.description || '');
    const [imageUri, setImageUri] = useState<string | undefined>(group.image);
    const [imageLoading, setImageLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const { getToken } = useAuth();
    const setToken = useTokenStore((state) => state.setToken);

    // Actualizar estados cuando cambie el grupo
    useEffect(() => {
        setName(group.name);
        setDescription(group.description || '');
        setImageUri(group.image);
    }, [group]);

    const handleClose = () => {
        // Resetear a valores originales
        setName(group.name);
        setDescription(group.description || '');
        setImageUri(group.image);
        onClose();
    };

    const handleSave = async () => {
        if (name.trim() === '') {
            Alert.alert('Error', 'El nombre del grupo no puede estar vacío');
            return;
        }
        
        setSaving(true);
        
        try {
            // Preparar datos para actualizar (solo name, description y lastModified)
            const updateData: Partial<Group> = {
                name: name.trim(),
                description: description.trim() || undefined,
                image: imageUri,
                lastModified: new Date()
            };

            const token = await getToken();
            setToken(token);
            
            // Llamar a la API para actualizar el grupo
            const updatedGroup = await editGroup(group.id, updateData);
            
            // Notificar al componente padre que el grupo se actualizó
            onGroupUpdated(updatedGroup);
            
            // Cerrar modal
            onClose();
            
            Alert.alert('Éxito', 'Grupo actualizado correctamente');
            
        } catch (error) {
            console.error('Error updating group:', error);
            Alert.alert('Error', 'No se pudo actualizar el grupo. Inténtalo de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    const showImageOptions = () => {
        const options = imageUri 
            ? ['Change Photo', 'Delete Photo', 'Cancel']
            : ['Select Photo', 'Cancel'];
        
        const destructiveButtonIndex = imageUri ? 1 : undefined;
        const cancelButtonIndex = imageUri ? 2 : 1;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex,
                    destructiveButtonIndex,
                },
                async (buttonIndex) => {
                    if (buttonIndex === 0) {
                        await handleChangePhoto();
                    } else if (buttonIndex === 1 && imageUri) {
                        await handleDeletePhoto();
                    }
                }
            );
        } else {
            // Android
            if (imageUri) {
                Alert.alert(
                    'Group Photo',
                    'What would you like to do?',
                    [
                        { text: 'Change Photo', onPress: handleChangePhoto },
                        { 
                            text: 'Delete Photo', 
                            onPress: handleDeletePhoto,
                            style: 'destructive'
                        },
                        { text: 'Cancel', style: 'cancel' },
                    ]
                );
            } else {
                handleChangePhoto();
            }
        }
    };

    const handleChangePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'We need access to your photos to select a group image.');
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
                    // Delete old photo if exists
                    if (imageUri) {
                        try {
                            await deleteGroupPhoto(imageUri);
                            console.log('🗑️ Foto anterior del grupo eliminada');
                        } catch (error) {
                            console.warn('⚠️ No se pudo eliminar la foto anterior:', error);
                        }
                    }

                    // Upload new photo
                    const downloadURL = await uploadGroupPhotoAsync(
                        result.assets[0].uri,
                        group.id
                    );

                    console.log('✅ Nueva foto de grupo subida:', downloadURL);
                    setImageUri(downloadURL);
                } catch (uploadError) {
                    console.error('❌ Error al cambiar foto de grupo:', uploadError);
                    Alert.alert('Error', 'Could not update group photo. Please try again.');
                } finally {
                    setImageLoading(false);
                }
            }
        } catch (error) {
            console.error('❌ Error selecting image:', error);
            Alert.alert('Error', 'Could not select image. Please try again.');
            setImageLoading(false);
        }
    };

    const handleDeletePhoto = async () => {
        Alert.alert(
            'Delete Photo',
            'Are you sure you want to delete the group photo?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setImageLoading(true);

                            if (imageUri) {
                                await deleteGroupPhoto(imageUri);
                                console.log('🗑️ Foto de grupo eliminada');
                            }

                            setImageUri(undefined);
                        } catch (error) {
                            console.error('❌ Error al eliminar foto:', error);
                            Alert.alert('Error', 'Could not delete photo. Please try again.');
                        } finally {
                            setImageLoading(false);
                        }
                    },
                },
            ]
        );
    };



    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
        >
            <View style={styles.modalOverlay}>
            <SafeAreaView style={styles.modalContainer}>
                {/* Header */}
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

                {/* Content */}
                <View style={styles.modalContent}>
                    {/* Imagen del grupo */}
                    <Pressable 
                        style={styles.imageContainer} 
                        onPress={showImageOptions}
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

                    {/* Campo de título */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Nombre del grupo</Text>
                        <TextInput
                            style={styles.titleInput}
                            value={name}
                            onChangeText={setName}
                            placeholder="Ingresa el nombre del grupo"
                            maxLength={50}
                            autoCapitalize="words"
                            returnKeyType="next"
                        />
                    </View>
                    
                    {/* Campo de descripción */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Descripción del grupo</Text>
                        <TextInput
                            style={styles.titleInput}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Ingresa una descripción (opcional)"
                            maxLength={100}
                            autoCapitalize="sentences"
                            returnKeyType="done"
                            onSubmitEditing={handleSave}
                            multiline={true}
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