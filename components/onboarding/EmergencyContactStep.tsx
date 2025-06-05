import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Image,
  Dimensions,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../lib/storage/useUserStorage';
import { EmergencyContact } from '@/api/types';
import EmergencyContactAddModal from '../EmergencyContactAddModal';

export default function EmergencyContactStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedContactCount, setSelectedContactCount] = useState(0);
  const { user, setUser } = useUserStore();

  const handleAddContact = (contactData: EmergencyContact) => {
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

    // You may want to update the user state here to add the new contact
    setUser({
      ...user,
      emergencyContacts: [
        ...(user.emergencyContacts || []),
        newContact,
      ],
    });
    setSelectedContactCount((prev) => prev + 1);
    setModalVisible(false);
  };

  const handleAddContactPress = () => {
    setModalVisible(true);
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

        <EmergencyContactAddModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onAddContact={handleAddContact}
        />

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
  image: {
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