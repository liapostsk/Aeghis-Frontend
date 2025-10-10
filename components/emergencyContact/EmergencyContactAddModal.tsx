import React, { useState, useEffect } from 'react';
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
import { Contact } from '@/api/types';
import { useUserStore } from '@/lib/storage/useUserStorage';


const { height } = Dimensions.get('window');

type Props = {
  visible: boolean;
  onClose: () => void;
  onAddContact: (contact: Contact) => void;
};

export default function EmergencyContactAddModal({ visible, onClose, onAddContact }: Props) {
  const [modalMode, setModalMode] = useState<'initial' | 'manual' | 'contacts'>('initial');
  const [contacts, setContacts] = useState<Contact[]>([]);

  const { user, setUser } = useUserStore();

  useEffect(() => {
    if (!visible) {
      setModalMode('initial');

      setContacts([]);
    }
  }, [visible]);

  const getContactsFromDevice = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'No se pudo acceder a los contactos.');
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
          phone: c.phoneNumbers![0].number!.replace(/[^\+\d]/g, ''), // Limpiar número
        }));

      if (transformedContacts.length > 0) {
        setContacts(transformedContacts);
        setModalMode('contacts');
      } else {
        Alert.alert('Sin contactos válidos', 'No se encontraron contactos con teléfono.');
      }
  };

  const handleCancel = () => {
    setModalMode('initial');
    onClose();
  };

  const renderContent = () => {
    switch (modalMode) {
      case 'manual':
        return (
          <ManualContactForm
            onSave={(contact) => {
              onAddContact(contact);
              setModalMode('initial');
              onClose();
            }}
            onCancel={() => setModalMode('initial')}
          />
        );

      case 'contacts':
        return (
          <>
            <ContactList
              contacts={contacts}
              onSelect={(contact) => {
                onAddContact(contact);
                setModalMode('initial');
                onClose();
              }}
              onCancel={() => setModalMode('initial')}
            />
            <Pressable style={styles.refreshButton} onPress={getContactsFromDevice}>
              <Text style={styles.buttonText}>Actualizar contactos</Text>
            </Pressable>
          </>
        );

      default:
        return (
          <>
            <Text style={styles.modalTitle}>Nuevo contacto de emergencia</Text>
            <Text style={styles.modalText}>¡Añade al menos uno!</Text>
            <Image
              source={require('@/assets/images/think.png')}
              style={styles.imageModal}
            />
            <Pressable
              style={styles.addButton}
              onPress={() => {
                getContactsFromDevice();
                setModalMode('contacts');
              }}
            >
              <Text style={styles.buttonText}>Desde contactos</Text>
            </Pressable>
            <Pressable
              style={[styles.addButton, { marginTop: 20 }]}
              onPress={() => setModalMode('manual')}
            >
              <Text style={styles.buttonText}>Agregar manualmente</Text>
            </Pressable>
            <Pressable onPress={handleCancel} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancelar</Text>
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
  addButton: {
    backgroundColor: '#7A33CC',
    borderRadius: 20,
    width: 250,
    height: 47,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    alignSelf: 'center',
  },
  refreshButton: {
    backgroundColor: '#7A33CC',
    borderRadius: 20,
    width: 250,
    height: 47,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    alignSelf: 'center',
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
