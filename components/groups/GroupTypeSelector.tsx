import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GroupTypeSelectorProps {
  visible: boolean;
  onSelectType: (type: 'CONFIANZA' | 'TEMPORAL') => void;
  onClose: () => void;
}

export default function GroupTypeSelector({ visible, onSelectType, onClose }: GroupTypeSelectorProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.groupTypeModal}>
          <Text style={styles.groupTypeTitle}>¿Qué tipo de grupo quieres crear?</Text>
          
          <Pressable 
            style={styles.groupTypeOption} 
            onPress={() => onSelectType('CONFIANZA')}
          >
            <View style={styles.typeIcon}>
              <Ionicons name="shield" size={32} color="#7A33CC" />
            </View>
            <View style={styles.typeInfo}>
              <Text style={styles.typeName}>Grupo de Confianza</Text>
              <Text style={styles.typeDescription}>
                Para familia y amigos cercanos. Permanente y con más funciones de seguridad.
              </Text>
            </View>
          </Pressable>

          <Pressable 
            style={styles.groupTypeOption} 
            onPress={() => onSelectType('TEMPORAL')}
          >
            <View style={styles.typeIcon}>
              <Ionicons name="time" size={32} color="#FF9800" />
            </View>
            <View style={styles.typeInfo}>
              <Text style={styles.typeName}>Grupo Temporal</Text>
              <Text style={styles.typeDescription}>
                Para ocasiones específicas. Se puede configurar para expirar automáticamente.
              </Text>
            </View>
          </Pressable>

          <Pressable 
            style={styles.cancelButton} 
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </Pressable>
        </View>
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
    padding: 20,
  },
  groupTypeModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  groupTypeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  groupTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});
