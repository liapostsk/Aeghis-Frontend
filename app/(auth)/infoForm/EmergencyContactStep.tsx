import { useState } from 'react';
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
import { Contact, EmergencyContact, ExternalContact } from '@/api/backend/types';
import EmergencyContactAddModal from '@/components/emergencyContact/EmergencyContactAddModal';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { checkIfUserExists } from '@/api/backend/user/userApi';
import { useTranslation } from 'react-i18next';

export default function EmergencyContactStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const { user, setUser } = useUserStore();

  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  const isEmptyOrNull = (value: any): boolean => {
    return value == null || value === "" || value === "null" || value === "undefined";
  };
  
  // Función para limpiar contactos
  const clearContacts = () => {
    if (user) {
      setUser({
        ...user,
        emergencyContacts: [],
        externalContacts: []
      });
    }
  };
  
  // Contadores de contactos
  const emergencyContactCount = user?.emergencyContacts?.length || 0;
  const externalContactCount = user?.externalContacts?.length || 0;
  const totalContactCount = emergencyContactCount + externalContactCount;

  // Validaciones de contacto
  const validateContact = (contactData: Contact): string | null => {
    if (!contactData.phone) return t('infoForm.emergencyContact.validation.phoneRequired');
    if (!user) return t('infoForm.emergencyContact.validation.userInfoMissing');
    if (contactData.phone === user.phone) return t('infoForm.emergencyContact.validation.cannotAddSelf');
    
    const alreadyExists = 
      (user.emergencyContacts ?? []).some(c => c.phone === contactData.phone) ||
      (user.externalContacts ?? []).some(c => c.phone === contactData.phone);
    if (alreadyExists) return t('infoForm.emergencyContact.validation.alreadyExists');
    
    return null;
  };

  // Añadir contacto de emergencia o externo
  const handleAddContact = async (contactData: Contact) => {
    const validationError = validateContact(contactData);
    if (validationError) {
      Alert.alert('Error', validationError);
      return;
    }

    setIsSearching(true);
    try {
      const token = await getToken();
      setToken(token);
      const existsUserId = await checkIfUserExists(contactData.phone);
      
      if (!isEmptyOrNull(existsUserId) && existsUserId !== null) {
        // Usuario registrado - Contacto de emergencia
        const draftEmergency: EmergencyContact = {
          id: 0, // Temporal, el backend asignará el ID real
          ownerId: user!.id ?? 0, // ID del usuario actual
          name: contactData.name ?? '',
          phone: contactData.phone,
          relation: contactData.relation ?? '',
          contactId: existsUserId,
          status: 'PENDING',
        };
        const updated = [...(user!.emergencyContacts ?? []), draftEmergency];
        setUser({ ...user!, emergencyContacts: updated });
      } else {
        // Usuario no registrado - Contacto externo
        const draftExternal: ExternalContact = {
          id: 0, // Temporal, el backend asignará el ID real
          name: contactData.name ?? '',
          phone: contactData.phone,
          relation: contactData.relation ?? '',
        };
        const updated = [...(user!.externalContacts ?? []), draftExternal];
        setUser({ ...user!, externalContacts: updated });
      }

      setModalVisible(false);
    } catch (e) {
      console.error('Error al agregar contacto:', e);
      Alert.alert(t('infoForm.index.error'), t('infoForm.emergencyContact.validation.addError'));
    } finally {
      setIsSearching(false);
    }
  };

  // Navegación hacia atrás con opción de limpiar
  const handleBackPress = () => {
    if (totalContactCount > 0) {
      Alert.alert(
        t('infoForm.emergencyContact.backAlert.title'),
        t('infoForm.emergencyContact.backAlert.message'),
        [
          { text: t('infoForm.emergencyContact.backAlert.keep'), onPress: onBack },
          { text: t('infoForm.emergencyContact.backAlert.delete'), onPress: () => { clearContacts(); onBack(); }, style: 'destructive' },
          { text: t('infoForm.emergencyContact.backAlert.cancel'), style: 'cancel' }
        ]
      );
    } else {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('infoForm.emergencyContact.title')}</Text>
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
              {totalContactCount === 1 
                ? t('infoForm.emergencyContact.contactCount.single', { count: totalContactCount })
                : t('infoForm.emergencyContact.contactCount.multiple', { count: totalContactCount })
              }
            </Text>
            {/* Mostrar desglose si hay ambos tipos */}
            {emergencyContactCount > 0 && externalContactCount > 0 && (
              <Text style={styles.contactBreakdownText}>
                {t('infoForm.emergencyContact.contactCount.breakdown', { 
                  emergencyCount: emergencyContactCount, 
                  externalCount: externalContactCount 
                })}
              </Text>
            )}
          </View>
        )}

        {/* Add Contact Button */}
        <Pressable 
          onPress={() => setModalVisible(true)} 
          style={[styles.addButton, totalContactCount > 0 && styles.addButtonSecondary]}
          disabled={isSearching}
        >
          <Text style={styles.addButtonText}>
            {isSearching 
              ? t('infoForm.emergencyContact.buttons.verifying') 
              : totalContactCount > 0 
                ? t('infoForm.emergencyContact.buttons.addAnother') 
                : t('infoForm.emergencyContact.buttons.addFirst')
            }
          </Text>
        </Pressable>

        {/* Clear Contacts Button - Solo mostrar si hay contactos */}
        {totalContactCount > 0 && (
          <Pressable onPress={clearContacts} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>{t('infoForm.emergencyContact.buttons.clear')}</Text>
          </Pressable>
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            {t('infoForm.emergencyContact.info')}
          </Text>
        </View>

      </View>

      {/* Bottom Navigation */}
      <View style={styles.buttonContainer}>
        <Pressable onPress={handleBackPress} style={styles.backButton}>
          <Text style={styles.backButtonText}>{t('infoForm.emergencyContact.buttons.back')}</Text>
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
            {t('infoForm.emergencyContact.buttons.continue')}
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

const { width } = Dimensions.get('window');

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
  clearButton: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 100, 0.5)',
  },
  clearButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
  },
});