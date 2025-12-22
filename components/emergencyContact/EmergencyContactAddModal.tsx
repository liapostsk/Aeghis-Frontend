import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  Image,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import ManualContactForm from './ManualContactForm';
import ContactList from './ContactList';
import { Contact } from '@/api/backend/types';
import { useTranslation } from 'react-i18next';


const { height } = Dimensions.get('window');

type Props = {
  visible: boolean;
  onClose: () => void;
  onAddContact: (contact: Contact) => void;
};

export default function EmergencyContactAddModal({ visible, onClose, onAddContact }: Props) {
  const { t } = useTranslation();
  const [modalMode, setModalMode] = useState<'initial' | 'manual' | 'contacts'>('initial');
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Limpiar estado cuando el modal se cierre
  useEffect(() => {
    if (!visible) {
      setModalMode('initial');
      setContacts([]);
    }
  }, [visible]);

  // Obtener contactos del dispositivo
  const getContactsFromDevice = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('emergencyContact.addModal.alerts.permissionDenied.title'),
        t('emergencyContact.addModal.alerts.permissionDenied.message')
      );
      return;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      sort: Contacts.SortTypes.FirstName,
    });

    const transformedContacts = data
      .filter(c => c.name && c.phoneNumbers?.length)
      .map(c => ({
        id: c.id || Math.random().toString(),
        name: c.name!,
        phone: c.phoneNumbers![0].number!.replace(/[^\+\d]/g, ''),
      }));

    if (transformedContacts.length > 0) {
      setContacts(transformedContacts);
      setModalMode('contacts');
    } else {
      Alert.alert(
        t('emergencyContact.addModal.alerts.noValidContacts.title'),
        t('emergencyContact.addModal.alerts.noValidContacts.message')
      );
    }
  };

  // Manejar contacto seleccionado/guardado
  const handleContactSaved = (contact: Contact) => {
    onAddContact(contact);
    setModalMode('initial');
    onClose();
  };

  const renderContent = () => {
    switch (modalMode) {
      case 'manual':
        return (
          <ManualContactForm
            onSave={handleContactSaved}
            onCancel={() => setModalMode('initial')}
          />
        );

      case 'contacts':
        return (
          <>
            <ContactList
              contacts={contacts}
              onSelect={handleContactSaved}
              onCancel={() => setModalMode('initial')}
            />
            <Pressable style={styles.button} onPress={getContactsFromDevice}>
              <Text style={styles.buttonText}>{t('emergencyContact.addModal.updateContacts')}</Text>
            </Pressable>
          </>
        );

      default: // Pantalla inicial
        return (
          <>
            <Text style={styles.modalTitle}>{t('emergencyContact.addModal.title')}</Text>
            <Text style={styles.modalText}>{t('emergencyContact.addModal.subtitle')}</Text>
            <Image
              source={require('@/assets/images/think.png')}
              style={styles.imageModal}
            />
            <Pressable style={styles.button} onPress={getContactsFromDevice}>
              <Text style={styles.buttonText}>{t('emergencyContact.addModal.fromContacts')}</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => setModalMode('manual')}
            >
              <Text style={styles.buttonText}>{t('emergencyContact.addModal.addManually')}</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>{t('emergencyContact.addModal.cancel')}</Text>
            </Pressable>
          </>
        );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalView}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            {renderContent()}
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalView: {
    height: height * 0.75,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    width: '100%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  imageModal: {
    width: 320,
    height: 300,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#7A33CC',
    borderRadius: 20,
    width: 250,
    height: 47,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    alignSelf: 'center',
  },
  buttonSecondary: {
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  cancelText: {
    color: '#888',
    fontSize: 16,
  },
});
