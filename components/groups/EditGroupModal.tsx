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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface EditGroupModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (name: string, description?: string, imageUrl?: string) => void;
    groupId: string;
    groupName: string;
    groupDescription?: string;
    groupImage?: string;
}

export default function EditGroupModal({ 
  visible, 
  onClose, 
  onSave, 
  groupId,
  groupName, 
  groupDescription,
  groupImage 
}: EditGroupModalProps) {
    const [name, setName] = useState(groupName);
    const [description, setDescription] = useState(groupDescription);
    const [imageUri, setImageUri] = useState<string | undefined>(groupImage);
    const [imageLoading, setImageLoading] = useState(false);

    // Actualizar estados cuando cambien las props
    useEffect(() => {
        setName(groupName);
        setDescription(groupDescription);
        setImageUri(groupImage);
    }, [groupName, groupDescription, groupImage]);

    const handleClose = () => {
        // Resetear a valores originales
        setName(groupName);
        setDescription(groupDescription);
        setImageUri(groupImage);
        onClose();
    };

    const handleSave = () => {
        if (name.trim() === '') {
            Alert.alert('Error', 'El nombre del grupo no puede estar vacío');
            return;
        }
        
        onSave(name.trim(), description.trim());
        onClose();
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
                <Pressable onPress={handleSave} disabled={imageLoading}>
                    {imageLoading ? (
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
                        onPress={() => console.log('Pick image pressed')}
                        disabled={imageLoading}
                    >
                        {imageLoading ? (
                            <View style={styles.groupImage}>
                                <ActivityIndicator size="large" color="#7A33CC" />
                            </View>
                        ) : imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.groupImage} />
                        ) : (
                            <View style={styles.placeholderImage}>
                                <Ionicons name="people" size={60} color="#9CA3AF" />
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
});