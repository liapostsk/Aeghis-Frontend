import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DeleteButtonProps {
  // Props del botón
  title?: string;
  style?: any;
  iconSize?: number;
  variant?: 'danger' | 'warning' | 'outline';
  
  // Props del modal de confirmación
  modalTitle: string;
  modalDescription: string;
  confirmationWord: string;
  itemName: string;
  isDangerous?: boolean;
  
  // Función de eliminación
  onDelete: () => Promise<void>;
  onSuccess?: () => void;
}

export default function DeleteButton({
  title = "Eliminar",
  style,
  iconSize = 20,
  variant = 'danger',
  modalTitle,
  modalDescription,
  confirmationWord,
  itemName,
  isDangerous = true,
  onDelete,
  onSuccess,
}: DeleteButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isConfirmationValid = inputText.trim().toLowerCase() === confirmationWord.toLowerCase();

  const handleDelete = async () => {
    if (!isConfirmationValid) {
      Alert.alert(
        'Palabra incorrecta',
        `Debes escribir exactamente "${confirmationWord}" para confirmar.`
      );
      return;
    }

    try {
      setIsLoading(true);
      await onDelete();
      handleClose();
      
      if (onSuccess) {
        onSuccess();
      } else {
        Alert.alert(
          'Eliminado exitosamente',
          `${itemName} ha sido eliminado correctamente.`
        );
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      Alert.alert(
        'Error',
        'Ocurrió un error al intentar eliminar. Por favor, inténtalo de nuevo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setInputText('');
    setIsLoading(false);
    setShowModal(false);
  };

  const getButtonStyle = () => {
    switch (variant) {
      case 'danger':
        return [styles.button, styles.dangerButton];
      case 'warning':
        return [styles.button, styles.warningButton];
      case 'outline':
        return [styles.button, styles.outlineButton];
      default:
        return [styles.button, styles.dangerButton];
    }
  };

  const getButtonTextStyle = () => {
    switch (variant) {
      case 'danger':
        return styles.dangerText;
      case 'warning':
        return styles.warningText;
      case 'outline':
        return styles.outlineText;
      default:
        return styles.dangerText;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'danger':
        return '#DC2626';
      case 'warning':
        return '#D97706';
      case 'outline':
        return '#DC2626';
      default:
        return '#DC2626';
    }
  };

  return (
    <>
      <Pressable
        style={[...getButtonStyle(), style]}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="trash" size={iconSize} color={getIconColor()} />
        <Text style={getButtonTextStyle()}>{title}</Text>
      </Pressable>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[
                styles.iconContainer,
                { backgroundColor: isDangerous ? '#FEE2E2' : '#FEF3C7' }
              ]}>
                <Ionicons 
                  name={isDangerous ? "warning" : "information-circle"} 
                  size={24} 
                  color={isDangerous ? "#DC2626" : "#D97706"} 
                />
              </View>
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <Text style={styles.modalDescription}>{modalDescription}</Text>

              {/* Item info */}
              <View style={styles.itemContainer}>
                <Text style={styles.itemLabel}>Elemento a eliminar:</Text>
                <Text style={styles.itemName}>{itemName}</Text>
              </View>

              {/* Confirmation input */}
              <View style={styles.confirmationContainer}>
                <Text style={styles.confirmationLabel}>
                  Para confirmar, escribe <Text style={styles.confirmationWord}>"{confirmationWord}"</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    isConfirmationValid && styles.inputValid,
                    !isConfirmationValid && inputText.length > 0 && styles.inputInvalid
                  ]}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder={`Escribe "${confirmationWord}"`}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              {/* Warning message */}
              {isDangerous && (
                <View style={styles.warningContainer}>
                  <Ionicons name="warning" size={16} color="#DC2626" />
                  <Text style={styles.warningModalText}>
                    Esta acción no se puede deshacer
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable 
                style={[styles.actionButton, styles.cancelButton]} 
                onPress={handleClose}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>

              <Pressable 
                style={[
                  styles.actionButton, 
                  styles.confirmButton,
                  !isConfirmationValid && styles.confirmButtonDisabled
                ]} 
                onPress={handleDelete}
                disabled={!isConfirmationValid || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[
                    styles.confirmButtonText,
                    !isConfirmationValid && styles.confirmButtonTextDisabled
                  ]}>
                    Eliminar
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Button styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  dangerButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warningButton: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  dangerText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#DC2626',
  },
  warningText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#D97706',
  },
  outlineText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#DC2626',
  },

  // Modal styles
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 0,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  itemContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  itemLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  confirmationContainer: {
    marginBottom: 20,
  },
  confirmationLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  confirmationWord: {
    fontWeight: '600',
    color: '#DC2626',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputValid: {
    borderColor: '#10B981',
  },
  inputInvalid: {
    borderColor: '#EF4444',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  warningModalText: {
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 8,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  confirmButton: {
    backgroundColor: '#DC2626',
  },
  confirmButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  confirmButtonTextDisabled: {
    color: '#9CA3AF',
  },
});

/*
<DeleteButton
  title="Eliminar Grupo"
  modalTitle="Eliminar Grupo"
  modalDescription="¿Estás seguro de que quieres eliminar este grupo? Esta acción eliminará permanentemente el grupo y todos los datos asociados."
  confirmationWord="ELIMINAR"
  itemName={group.name}
  onDelete={async () => await deleteGroup(group.id)}
  onSuccess={() => console.log('Grupo eliminado')}
  variant="danger"
  isDangerous={true}
/>

Props principales:
modalTitle: Título del modal de confirmación
modalDescription: Descripción detallada de lo que se va a eliminar
confirmationWord: Palabra que el usuario debe escribir para confirmar
itemName: Nombre del elemento a eliminar
onDelete: Función async que hace la llamada a la API
onSuccess: Función opcional que se ejecuta tras eliminar exitosamente
Props opcionales de estilo:
title: Texto del botón (default: "Eliminar")
variant: 'danger' | 'warning' | 'outline'
iconSize: Tamaño del ícono
style: Estilos personalizados del botón
isDangerous: Si mostrar advertencia adicional

*/