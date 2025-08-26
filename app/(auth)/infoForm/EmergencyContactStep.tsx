import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/lib/storage/useUserStorage';
import { EmergencyContact } from '@/api/types';
import EmergencyContactAddModal from '@/components/emergencyContact/EmergencyContactAddModal';

export default function EmergencyContactStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const { user, setUser } = useUserStore();
  
  // Calcular el count directamente desde el store en lugar de usar estado local
  const selectedContactCount = user?.emergencyContacts?.length || 0;

  const handleAddContact = (contactData: EmergencyContact) => {
    if (!contactData.name || !contactData.phone) return;

     if (!user) {
      Alert.alert('Error', 'User information is missing.');
      return;
    }

    // Verificar si el contacto ya existe (por teléfono)
    const existingContact = user.emergencyContacts?.find(
      contact => contact.phone === contactData.phone
    );

    if (existingContact) {
      Alert.alert('Contacto duplicado', 'Este contacto ya ha sido agregado.');
      return;
    }

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

    console.log("Mirar User:", user);
    setModalVisible(false);
  };

  const handleAddContactPress = () => {
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Contactos de Emergencia</Text>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.imageContainer}>
          <Image
            source={require('@/assets/images/emergencyContacts1.png')}
            style={styles.image}
          />
        </View>

        {/* Contact Count Display */}
        {selectedContactCount > 0 && (
          <View style={styles.contactCountContainer}>
            <Text style={styles.contactCountText}>
              {selectedContactCount} contacto{selectedContactCount > 1 ? 's' : ''} agregado{selectedContactCount > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Add Contact Button */}
        <Pressable 
          onPress={handleAddContactPress} 
          style={[styles.addButton, selectedContactCount > 0 && styles.addButtonSecondary]}
        >
          <Text style={styles.addButtonText}>
            {selectedContactCount > 0 ? '+ Agregar otro contacto' : '+ Agregar contacto'}
          </Text>
        </Pressable>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            💡 Tus contactos solo serán notificados en emergencias y no necesitan descargar la app
          </Text>
        </View>

      </View>

      {/* Bottom Navigation */}
      <View style={styles.buttonContainer}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Atrás</Text>
        </Pressable>
        
        <Pressable 
          onPress={onNext} 
          style={[
            styles.continueButton, 
            selectedContactCount === 0 && styles.continueButtonDisabled
          ]}
          disabled={selectedContactCount === 0}
        >
          <Text style={[
            styles.continueButtonText,
            selectedContactCount === 0 && styles.continueButtonTextDisabled
          ]}>
            Continuar
          </Text>
        </Pressable>
      </View>

      <EmergencyContactAddModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddContact={handleAddContact}
      />

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
  header: {
    bottom: "10%",
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    bottom: "5%",
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#B8B8D1',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  contactCountContainer: {
    backgroundColor: 'rgba(122, 51, 204, 0.2)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(122, 51, 204, 0.3)',
    marginBottom: 20,
  },
  contactCountText: {
    color: '#B8B8D1',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  addButtonSecondary: {
    backgroundColor: 'yellow',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  addButtonText: {
    color: '#7A33CC',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#7A33CC',
    marginTop: 30,
  },
  infoText: {
    fontSize: 16,
    color: '#B8B8D1',
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#7A33CC',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#7A33CC',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(122, 51, 204, 0.3)',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
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
  },
  addButton: {
    backgroundColor: 'yellow',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    width: 250,
    height: 47,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    top: "5%",
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
});