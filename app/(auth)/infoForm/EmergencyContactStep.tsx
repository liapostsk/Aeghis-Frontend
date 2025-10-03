import React, { useState } from 'react';
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
import { Contact, EmergencyContact, ExternalContact } from '@/api/types';
import EmergencyContactAddModal from '@/components/emergencyContact/EmergencyContactAddModal';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { checkIfUserExists } from '@/api/user/userApi';
import { createEmergencyContact } from '@/api/contacts/emergencyContactsApi';

export default function EmergencyContactStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const { user, setUser } = useUserStore();

  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);
  
  // Numero de contactos seleccionados
  const emergencyContactCount = user?.emergencyContacts?.length || 0;
  const externalContactCount = user?.externalContacts?.length || 0;
  const totalContactCount = emergencyContactCount + externalContactCount;

  const checkUserExists = async (phone: string): Promise<any | null> => {
    try {
      const token = await getToken();
      setToken(token);
      
      console.log('Buscando usuario con teléfono:', phone);
      const foundUser = await checkIfUserExists(phone);
      console.log('Existe?:', foundUser);
      return foundUser;
    } catch (error) {
      console.error('Error buscando usuario:', error);
      return null;
    }
  };

  // Verifica si el contacto ya existe en contactos de emergencia o externos
  const isDuplicateContact = (phone: string): boolean => {
    // Verificar duplicados en contactos de emergencia
    const isDuplicateEmergency = user?.emergencyContacts?.some(
      contact => contact.phone === phone
    );

    // Verificar duplicados en contactos externos
    const isDuplicateExternal = user?.externalContacts?.some(
      contact => contact.phone === phone
    );

    return !!isDuplicateEmergency || !!isDuplicateExternal;
  };

  // Añade un nuevo contacto de emergencia ya sea usuario o externo
  const handleAddContact = async (contactData: Contact) => {
    if (!contactData.name || !contactData.phone) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Información de usuario faltante.');
      return;
    }

    // Verificar duplicados
    if (isDuplicateContact(contactData.phone)) {
      Alert.alert('Contacto duplicado', 'Este contacto ya ha sido agregado.');
      return;
    }

    // Verificar que no se esté agregando a sí mismo
    if (contactData.phone === user.phone) {
      Alert.alert('Error', 'No puedes agregarte a ti mismo como contacto de emergencia.');
      return;
    }

    setIsSearching(true);

    try {
      // Buscar si el número pertenece a un usuario de la app
      const foundUser = await checkUserExists(contactData.phone);
      console.log('Resultado de búsqueda de usuario:', foundUser);

      if (foundUser) {
        // Si es usuario de la app, crear contacto de emergencia
        const newEmergencyContact: Partial<EmergencyContact> = {
          name: contactData.name || '',
          phone: contactData.phone,
          relation: contactData.relation || '',
          status: 'PENDING',
        };
        
        console.log('Creando contacto de emergencia:', newEmergencyContact);
        const contactId = await createEmergencyContact(newEmergencyContact as EmergencyContact);
        console.log('Contacto creado con ID:', contactId);

        // Actualizar estado local del usuario
        const updatedEmergencyContacts = [
          ...(user.emergencyContacts || []),
          { ...newEmergencyContact, id: contactId } as EmergencyContact
        ];

        setUser({
          ...user,
          emergencyContacts: updatedEmergencyContacts,
        });

      } else {
        // Si NO es usuario de la app, crear contacto externo
        const newExternalContact: Partial<ExternalContact> = {
          name: contactData.name || '',
          phone: contactData.phone,
        };

        console.log('Creando contacto externo:', newExternalContact);
        
        // Actualizar estado local con contacto externo
        const updatedExternalContacts = [
          ...(user.externalContacts || []),
          newExternalContact as ExternalContact
        ];

        setUser({
          ...user,
          externalContacts: updatedExternalContacts,
        });
      }

      console.log('Usuario actualizado:', user);
      setModalVisible(false);

    } catch (error) {
      console.error('Error procesando contacto:', error);
      Alert.alert('Error', 'No se pudo agregar el contacto. Inténtalo de nuevo.');
    } finally {
      setIsSearching(false);
    }
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
        {totalContactCount > 0 && (
          <View style={styles.contactCountContainer}>
            <Text style={styles.contactCountText}>
              {totalContactCount} contacto{totalContactCount > 1 ? 's' : ''} agregado{totalContactCount > 1 ? 's' : ''}
            </Text>
            {/* Mostrar desglose si hay ambos tipos */}
            {emergencyContactCount > 0 && externalContactCount > 0 && (
              <Text style={styles.contactBreakdownText}>
                {emergencyContactCount} en app • {externalContactCount} externos
              </Text>
            )}
          </View>
        )}

        {/* Add Contact Button */}
        <Pressable 
          onPress={handleAddContactPress} 
          style={[styles.addButton, totalContactCount > 0 && styles.addButtonSecondary]}
          disabled={isSearching}
        >
          <Text style={styles.addButtonText}>
            {isSearching 
              ? 'Verificando...' 
              : totalContactCount > 0 
                ? '+ Agregar otro contacto' 
                : '+ Agregar contacto'
            }
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
            totalContactCount === 0 && styles.continueButtonDisabled
          ]}
          disabled={totalContactCount === 0}
        >
          <Text style={[
            styles.continueButtonText,
            totalContactCount === 0 && styles.continueButtonTextDisabled
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  contactCountText: {
    color: '#B8B8D1',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Nuevo estilo para el desglose
  contactBreakdownText: {
    color: '#B8B8D1',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8,
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    width: 250,
    height: 47,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  addButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#7A33CC',
  },
  addButtonText: {
    color: '#7A33CC',
    fontSize: 16,
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
    width: 300,
    height: 300,
  },
  imageContainer: {
    width: width * 0.8,
    height: width * 0.6,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
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