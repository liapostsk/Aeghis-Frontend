import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface GroupTypeSelectorProps {
  visible: boolean;
  onSelectType: (type: 'CONFIANZA' | 'TEMPORAL') => void;
  onClose: () => void;
}

export default function GroupTypeSelector({ visible, onSelectType, onClose }: GroupTypeSelectorProps) {
  const { t } = useTranslation();
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.groupTypeModal}>
          <Text style={styles.groupTypeTitle}>{t('groupTypeSelector.title')}</Text>
          
          <Pressable 
            style={styles.groupTypeOption} 
            onPress={() => onSelectType('CONFIANZA')}
          >
            <View style={styles.typeIcon}>
              <Ionicons name="shield" size={32} color="#7A33CC" />
            </View>
            <View style={styles.typeInfo}>
              <Text style={styles.typeName}>{t('groupTypeSelector.confianza.name')}</Text>
              <Text style={styles.typeDescription}>
                {t('groupTypeSelector.confianza.description')}
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
              <Text style={styles.typeName}>{t('groupTypeSelector.temporal.name')}</Text>
              <Text style={styles.typeDescription}>
                {t('groupTypeSelector.temporal.description')}
              </Text>
            </View>
          </Pressable>

          <Pressable 
            style={styles.cancelButton} 
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>{t('groupTypeSelector.cancel')}</Text>
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
