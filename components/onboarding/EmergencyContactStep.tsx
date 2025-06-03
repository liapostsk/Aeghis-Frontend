import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Image,
  Dimensions,
  Pressable,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Contacts from 'expo-contacts';
import ContactList from './ContactList';
import ManualContactForm from './ManualContactForm';
import { useUserStore } from '../../lib/storage/useUserStorage';
import { EmergencyContact } from '@/api/types';

export default function EmergencyContactStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'initial' | 'manual' | 'contacts'>('initial');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContactCount, setSelectedContactCount] = useState(0);
  const { user, setUser } = useUserStore();

  const handleAddContact = (contactData: { name: string; phone: string }) => {
    if (!contactData.name || !contactData.phone) return;

    // Crea un nuevo contacto de emergencia
    const newContact: EmergencyContact = {
      ownerId: user?.id || 0, // o déjalo como 0 si el usuario aún no tiene ID
      emergencyContactId: undefined, // No es un usuario de la app, así que no tiene ID de emergencia
      name: contactData.name,
      phone: contactData.phone,
      confirmed: false,
    };

    if (!user) {
      Alert.alert('Error', 'User information is missing.');
      return;
    }

    const updatedUser = {
      ...user,
      emergencyContacts: [...(user.emergencyContacts || []), newContact],
    };

    setUser(updatedUser);

    setSelectedContactCount((prev) => prev + 1);
    setModalVisible(false);
    setModalMode("initial");
  };

  const getContactsFromDevice = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your contacts to continue.');
      return;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
    });

    if (data.length > 0) {
      const filtered = data.filter(c => c.phoneNumbers && c.phoneNumbers.length > 0);
      if (filtered.length > 0) {
        setContacts(filtered);
      } else {
        Alert.alert('No Valid Contacts', 'No contacts with phone numbers were found.');
      }
    } else {
      Alert.alert('No Contacts', 'No contacts were found on your device.');
    }
  };

  // Maneja el botón "Add a contact"
  const handleAddContactPress = () => {
    setModalVisible(true);
    setModalMode('initial');
  };

  // Renderiza el contenido modal según el modo actual
  const renderModalContent = () => {
    switch (modalMode) {
      case 'manual':
        return (
          <ManualContactForm
            onSave={handleAddContact}
            onCancel={() => setModalMode('initial')}
          />
        );
      
      case 'contacts':
        return (
          <>
            <ContactList
              contacts={contacts}
              onSelect={handleAddContact}
              onCancel={() => setModalMode('initial')}
            />
            <Pressable
              style={styles.refreshButton}
              onPress={getContactsFromDevice}
            >
              <Text style={styles.buttonText}>Refresh Contacts</Text>
            </Pressable>
          </>
        );
      
      default: // 'initial'
        return (
          <>
            <Text style={styles.modalTitle}>New Emergency Contact</Text>
            <Text style={styles.modalText}>Add at least one emergency contact here!</Text>
            <Image
              source={require('../../assets/images/think.png')}
              style={styles.imageModal}
            />
            <Pressable 
              style={styles.addButton} 
              onPress={() => {
                getContactsFromDevice();
                setModalMode('contacts');
              }}
            >
              <Text style={styles.buttonText}>Add from Contacts</Text>
            </Pressable>
            <Pressable
              style={[styles.addButton, { marginTop: 20 }]}
              onPress={() => setModalMode('manual')}
            >
              <Text style={styles.buttonText}>Add manually</Text>
            </Pressable>
            <Pressable onPress={() => setModalVisible(false)} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Add Emergency Contacts</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/images/emergencyContacts1.png')}
          style={styles.image}
        />

        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContainer}
              >
                {renderModalContent()}
              </KeyboardAvoidingView>
            </View>
          </View>
        </Modal>

        <Pressable onPress={handleAddContactPress} style={styles.addButton}>
          <Text style={styles.buttonText}>
            {selectedContactCount > 0 
              ? `Add another contact (${selectedContactCount} added)` 
              : 'Add a contact'}
          </Text>
        </Pressable>
        <Text style={styles.text}>
          This contact will only be notified in case of an emergency. They won't need to download
          the app.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Back" onPress={onBack} />
        <Button 
          title="Continue" 
          onPress={onNext} 
          disabled={selectedContactCount === 0}
        />
      </View>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  text: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 40,
    marginHorizontal: 30,
  },
  modalText: {
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalView: {
    height: height * 0.75,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
  image: {
    width: 350,
    height: 350,
  },
  imageModal: {
    top: -55,
    width: 350,
    height: 350,
  },
  imageContainer: {
    width: width * 0.8,
    height: width * 0.8,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#7A33CC',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    width: 250,
    height: 47,
    alignSelf: 'center',
    marginTop: 10,
  },
  refreshButton: {
    backgroundColor: '#7A33CC',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    width: 250,
    height: 47,
    alignSelf: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 10,
  },
  cancelText: {
    color: '#888',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
});