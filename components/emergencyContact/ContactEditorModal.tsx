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
  Alert,
} from 'react-native';
import { EmergencyContact, ExternalContact, Contact } from '@/api/backend/types';
import { useTranslation } from 'react-i18next';

type Props = {
  visible: boolean;
  contact: EmergencyContact | ExternalContact | null;
  isEmergencyContact?: boolean;
  onClose: () => void;
  onSave: (contact: Contact) => void;
  onDelete?: () => void;
};

export default function ContactEditorModal({
  visible,
  contact,
  isEmergencyContact = false,
  onClose,
  onSave,
}: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');

  const isNameEditable = !isEmergencyContact;
  const isPhoneEditable = !isEmergencyContact;

  useEffect(() => {
    if (contact) {
      setName(contact.name ?? '');
      setPhone(contact.phone ?? '');
      setRelation(contact.relation ?? '');
    }
    else {
      setName('');
      setPhone('');
      setRelation('');
    }
  }, [contact, visible]);

  const handleSave = () => {
    if (isEmergencyContact) {
      // Para contactos de emergencia, solo validar relación
      if (!relation.trim()) {
        Alert.alert(t('error'), t('emergencyContact.editorModal.errors.relationRequired'));
        return;
      }
    } else {
      // Para contactos externos, validar todos los campos
      if (!name.trim() || !phone.trim()) {
        Alert.alert(t('error'), t('emergencyContact.editorModal.errors.fieldsRequired'));
        return;
      }
    }

    const updatedContact: Contact = {
      phone: isPhoneEditable ? phone.trim() : contact?.phone || '',
      name: isNameEditable ? name.trim() : contact?.name,
      relation: relation.trim(),
    };

    console.log('Guardando contacto:', updatedContact);
    console.log('Tipo de contacto:', isEmergencyContact ? 'Emergency' : 'External');

    onSave(updatedContact);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <View style={styles.modal}>
            <Text style={styles.title}>{t('emergencyContact.editorModal.title')}</Text>
          {}
            <TextInput
              style={styles.input}
              placeholder={t('emergencyContact.editorModal.namePlaceholder')}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder={t('emergencyContact.editorModal.phonePlaceholder')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder={t('emergencyContact.editorModal.relationPlaceholder')}
              value={relation}
              onChangeText={setRelation}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancelText}>{t('emergencyContact.editorModal.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.saveText}>{t('emergencyContact.editorModal.save')}</Text>
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
  deleteText: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
