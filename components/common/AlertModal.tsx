import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
  type?: 'default' | 'success' | 'warning' | 'danger';
}

export default function AlertModal({
  visible,
  title,
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  confirmButtonColor,
  cancelButtonColor,
  icon,
  iconColor,
  onConfirm,
  onCancel,
  showCancelButton = true,
  type = 'default',
}: AlertModalProps) {
  
  // Configuración por tipo
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: icon || 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
          iconColor: iconColor || '#22C55E',
          confirmButtonColor: confirmButtonColor || '#22C55E',
        };
      case 'warning':
        return {
          icon: icon || 'warning' as keyof typeof Ionicons.glyphMap,
          iconColor: iconColor || '#F59E0B',
          confirmButtonColor: confirmButtonColor || '#F59E0B',
        };
      case 'danger':
        return {
          icon: icon || 'alert-circle' as keyof typeof Ionicons.glyphMap,
          iconColor: iconColor || '#EF4444',
          confirmButtonColor: confirmButtonColor || '#EF4444',
        };
      default:
        return {
          icon: icon || 'information-circle' as keyof typeof Ionicons.glyphMap,
          iconColor: iconColor || '#7A33CC',
          confirmButtonColor: confirmButtonColor || '#7A33CC',
        };
    }
  };

  const config = getTypeConfig();

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icono */}
          {config.icon && (
            <View style={styles.iconContainer}>
              <Ionicons 
                name={config.icon} 
                size={48} 
                color={config.iconColor} 
              />
            </View>
          )}

          {/* Título */}
          <Text style={styles.title}>{title}</Text>

          {/* Mensaje */}
          <Text style={styles.message}>{message}</Text>

          {/* Botones */}
          <View style={styles.buttonContainer}>
            {showCancelButton && (
              <Pressable
                style={[
                  styles.button,
                  styles.cancelButton,
                  cancelButtonColor && { backgroundColor: cancelButtonColor }
                ]}
                onPress={handleCancel}
              >
                <Text style={[
                  styles.buttonText,
                  styles.cancelButtonText,
                  cancelButtonColor && { color: '#FFFFFF' }
                ]}>
                  {cancelText}
                </Text>
              </Pressable>
            )}

            <Pressable
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: config.confirmButtonColor },
                !showCancelButton && styles.singleButton
              ]}
              onPress={handleConfirm}
            >
              <Text style={[styles.buttonText, styles.confirmButtonText]}>
                {confirmText}
              </Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    minWidth: 280,
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  singleButton: {
    flex: 0,
    minWidth: 120,
  },
  confirmButton: {
    backgroundColor: '#7A33CC',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#6B7280',
  },
});