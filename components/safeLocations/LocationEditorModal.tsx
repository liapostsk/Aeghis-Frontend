import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeLocation } from '@/api/backend/locations/locationType';

type Props = {
  visible: boolean;
  location: SafeLocation;
  onClose: () => void;
  onSave: (location: SafeLocation) => void;
};

export default function LocationEditorModal({
  visible,
  location,
  onClose,
  onSave,
}: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [type, setType] = useState('');

  useEffect(() => {
    if (location) {
      setName(location.name ?? '');
      setType(location.type ?? '');
    }
  }, [location, visible]);

  const handleSave = () => {
    if (!name || !type) return;

    const updated: SafeLocation = {
      ...location,
      name,
      type,
    };

    onSave(updated);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <View style={styles.modal}>
            <Text style={styles.title}>{t('locationEditorModal.title')}</Text>

            <TextInput
              style={styles.input}
              placeholder={t('locationEditorModal.namePlaceholder')}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder={t('locationEditorModal.typePlaceholder')}
              value={type}
              onChangeText={setType}
            />
            
            {/* Campo de dirección solo para mostrar - no editable */}
            <View style={styles.addressContainer}>
              <Text style={styles.addressLabel}>{t('locationEditorModal.addressLabel')}</Text>
              <Text style={styles.addressText}>{location.address}</Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancelText}>{t('locationEditorModal.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.saveText}>{t('locationEditorModal.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelText: {
    color: '#888',
    fontSize: 16,
  },
  saveText: {
    color: '#7A33CC',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addressContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  addressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
});
