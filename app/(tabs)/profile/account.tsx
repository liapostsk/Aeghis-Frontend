
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Pressable, Modal, ScrollView } from 'react-native';
import { useUserStore } from '@/lib/storage/useUserStorage';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { updateUser } from '@/api/backend/user/userApi';
import { mapUserToDto } from '@/api/backend/user/mapper';
import { useAuth } from '@clerk/clerk-expo';
import { useUser } from '@clerk/clerk-expo';
import { useState } from 'react';

interface profileHeaderProps {
  onDelete: () => void;
}

export default function AccountSettingsScreen({onDelete}: profileHeaderProps) {
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const { sessionId } = useAuth();

  const router = useRouter();

  const { user: clerkUser } = useUser(); // Clerk user actual

  const { user, setUser } = useUserStore();
  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  const [editable, setEditable] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const [pendingVerification, setPendingVerification] = useState<{
    type: 'email' | 'phone';
    verifier: any; // Clerk email/phone object con método .attemptVerification
  } | null>(null);

  const [verificationCode, setVerificationCode] = useState('');


  // Validación de email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validación de teléfono
  const isValidPhone = (phone: string) => {
    const phoneRegex = /^[+]?[\d\s\-\(\)]{8,}$/;
    return phoneRegex.test(phone);
  };

  const handleConfirmDeleteAccount = () => {
    setShowDeleteWarning(true);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText.toLowerCase() === 'eliminar') {
      setShowDeleteWarning(false);
      setDeleteConfirmText('');
      onDelete();
    } else {
      Alert.alert('Error', 'Por favor escribe "eliminar" para confirmar.');
    }
  };

  const handleSave = async () => {
    // Validaciones
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es requerido.');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'El correo electrónico es requerido.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Error', 'El teléfono es requerido.');
      return;
    }

    if (!isValidPhone(phone)) {
      Alert.alert('Error', 'Por favor ingresa un número de teléfono válido.');
      return;
    }

    const hasChanges = 
      name.trim() !== user?.name ||
      email.trim().toLowerCase() !== user?.email ||
      phone.trim() !== user?.phone;

    if (!hasChanges) {
      Alert.alert('Información', 'No hay cambios para guardar.');
      setEditable(false);
      return;
    }

    if (!user || user.id === undefined) {
      Alert.alert('Error', 'No se pudo actualizar el usuario: ID no definido.');
      return;
    }

    const updatedUser = {
      ...user,
      name: name.trim(),
    };

    try {
      const token = await getToken();
      setToken(token);

      // 1. Actualizar el usuario en la base de datos
      await updateUser(user.id, mapUserToDto(updatedUser));
      setUser(updatedUser);

      // 2. Si el teléfono cambió, actualizar en Clerk
      if (clerkUser && phone.trim() !== user?.phone) {
        const newPhone = await clerkUser.createPhoneNumber({ phoneNumber: phone.trim() });

        await newPhone.prepareVerification();

        setPendingVerification({
          type: 'phone',
          verifier: newPhone,
        });
      }


      // 3. Si el email cambió, crear un nuevo email en Clerk
      if (clerkUser && email.trim().toLowerCase() !== user?.email) {
        // Creamos un nuevo email
        const newEmail = await clerkUser.createEmailAddress({ email: email.trim().toLowerCase() });

        const token = await getToken();
        setToken(token);
        await newEmail.prepareVerification({ strategy: 'email_code' });

        // Mostrar modal para verificar
        setPendingVerification({
          type: 'email',
          verifier: newEmail,
        });
      }
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      Alert.alert('Error', 'No se pudo actualizar la información. Intenta nuevamente.');
    }

    setEditable(false);
  };

  const handleVerifyCode = async () => {
    try {
      await pendingVerification?.verifier.attemptVerification({ code: verificationCode });

      await delay(2000);
      await clerkUser?.reload();

      if (pendingVerification?.type === 'email') {
        const newEmailId = pendingVerification.verifier.id;

        const newEmail = clerkUser?.emailAddresses.find(e => e.id === newEmailId);
        if (newEmail) {
          await clerkUser?.reload();

          // 2. Buscar el correo anterior antes de borrar
          const oldEmail = clerkUser?.emailAddresses.find(
            (e) => e.id !== newEmailId && e.id === clerkUser?.primaryEmailAddressId
          );

          // 3. Eliminar el anterior
          if (clerkUser) {
            const emailToDelete = clerkUser.emailAddresses.find(e => e.id === oldEmail?.id);
            if (emailToDelete) {
              await emailToDelete.destroy();
            }
          }

          const updatedUser = {
            ...user,
            email: newEmail.emailAddress,
          };
          try {
            const token = await getToken();
            setToken(token);

            if (user && user.id !== undefined) {
              await updateUser(user.id, mapUserToDto(updatedUser));
              setUser(updatedUser);
            }
          } catch (error) {
            console.error('Error actualizando usuario:', error);
            Alert.alert('Error', 'No se pudo actualizar la información. Intenta nuevamente.');
          }

        }

        Alert.alert('Éxito', 'Correo verificado y actualizado correctamente.');
      }

      if (pendingVerification?.type === 'phone') {
        const newPhoneId = pendingVerification.verifier.id;

        const newPhone = clerkUser?.phoneNumbers.find(p => p.id === newPhoneId);
        if (newPhone) {
          await clerkUser?.reload();

          // 2. Buscar el correo anterior antes de borrar
          const oldPhone = clerkUser?.phoneNumbers.find(
            (e) => e.id !== newPhoneId && e.id === clerkUser?.primaryPhoneNumberId
          );

          // 3. Eliminar el anterior
          if (clerkUser) {
            const phoneToDelete = clerkUser.phoneNumbers.find(e => e.id === oldPhone?.id);
            if (phoneToDelete) {
              await phoneToDelete.destroy();
            }
          }

          const updatedUser = {
            ...user,
            phone: newPhone.phoneNumber,
          };
          try {
            const token = await getToken();
            setToken(token);

            if (user && user.id !== undefined) {
              await updateUser(user.id, mapUserToDto(updatedUser));
              setUser(updatedUser);
            }
          } catch (error) {
            console.error('Error actualizando usuario:', error);
            Alert.alert('Error', 'No se pudo actualizar la información. Intenta nuevamente.');
          }
        }

        Alert.alert('Éxito', 'Teléfono verificado y actualizado correctamente.');
      }

      setPendingVerification(null);
      setVerificationCode('');
    } catch (err) {
      console.error('Error al verificar:', err);
      Alert.alert('Error', 'Código inválido o expirado. Intenta de nuevo.');
    }
  };

  const handleCancel = () => {
    setEditable(false);
    setName(user?.name || '');
    setEmail(user?.email || '');
    setPhone(user?.phone || '');
  };

  const DeleteWarningModal = () => (
    <Modal
      visible={showDeleteWarning}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDeleteWarning(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={50} color="#FF6B6B" />
            <Text style={styles.warningTitle}>¡Atención!</Text>
          </View>
          
          <Text style={styles.warningText}>
            Estás a punto de eliminar tu cuenta permanentemente. Esta acción no se puede deshacer.
          </Text>
          
          <Text style={styles.warningSubtext}>
            Se eliminarán todos tus datos, incluyendo:
          </Text>
          
          <View style={styles.warningList}>
            <Text style={styles.warningListItem}>• Información personal</Text>
            <Text style={styles.warningListItem}>• Historial de actividad</Text>
            <Text style={styles.warningListItem}>• Configuraciones guardadas</Text>
          </View>
          
          <Text style={styles.confirmationText}>
            Para confirmar, escribe "eliminar" en el campo de abajo:
          </Text>
          
          <TextInput
            style={styles.confirmationInput}
            value={deleteConfirmText}
            onChangeText={setDeleteConfirmText}
            placeholder="Escribe 'eliminar' para confirmar"
            placeholderTextColor="#999"
            autoCapitalize="none"
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => {
                setShowDeleteWarning(false);
                setDeleteConfirmText('');
              }}
            >
              <Text style={styles.cancelModalButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.deleteModalButton,
                deleteConfirmText.toLowerCase() !== 'eliminar' && styles.disabledButton
              ]}
              onPress={handleDeleteAccount}
              disabled={deleteConfirmText.toLowerCase() !== 'eliminar'}
            >
              <Text style={styles.deleteModalButtonText}>Eliminar Cuenta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Información de Cuenta</Text>

        <View style={styles.formContainer}>
          <View style={styles.field}>
            <Text style={styles.label}>Nombre completo</Text>
            <TextInput
              style={[styles.input, !editable && styles.disabledInput]}
              value={name}
              onChangeText={setName}
              editable={editable}
              placeholder="Ingresa tu nombre completo"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput
              style={[styles.input, !editable && styles.disabledInput]}
              value={email}
              onChangeText={setEmail}
              editable={editable}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={[styles.input, !editable && styles.disabledInput]}
              value={phone}
              onChangeText={setPhone}
              editable={editable}
              keyboardType="phone-pad"
              placeholder="+1 234 567 8900"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.buttonsContainer}>
            {editable ? (
              <>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Ionicons name="checkmark" size={20} color="white" />
                  <Text style={styles.buttonText}>Guardar Cambios</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Ionicons name="close" size={20} color="#7A33CC" />
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.editButton} onPress={() => setEditable(true)}>
                <Ionicons name="create-outline" size={20} color="white" />
                <Text style={styles.buttonText}>Editar Información</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerZoneTitle}>Zona de Peligro</Text>
          <Pressable style={styles.deleteAccountButton} onPress={handleConfirmDeleteAccount}>
            <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
            <View style={styles.deleteAccountContent}>
              <Text style={styles.deleteAccountText}>Eliminar cuenta</Text>
              <Text style={styles.deleteAccountSubtext}>
                Esta acción no se puede deshacer
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FF6B6B" />
          </Pressable>
        </View>
      </ScrollView>

      <DeleteWarningModal />

      <Modal
        visible={!!pendingVerification}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPendingVerification(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.warningTitle}>Verifica tu {pendingVerification?.type === 'email' ? 'correo' : 'teléfono'}</Text>
            <Text style={styles.warningText}>
              Ingresa el código que recibiste por {pendingVerification?.type === 'email' ? 'correo electrónico' : 'SMS'}.
            </Text>

            <TextInput
              style={styles.confirmationInput}
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              placeholder="Código de verificación"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => {
                  setVerificationCode('');
                  setPendingVerification(null);
                }}
              >
                <Text style={styles.cancelModalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteModalButton}
                onPress={handleVerifyCode}
                disabled={!verificationCode.trim() || verificationCode.length < 6}
              >
                <Text style={styles.deleteModalButtonText}>Verificar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8ff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7A33CC',
    marginBottom: 30,
    textAlign: 'center',
    marginTop: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    color: '#333',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  buttonsContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#7A33CC',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#7A33CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cancelButton: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7A33CC',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  cancelButtonText: {
    color: '#7A33CC',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  dangerZone: {
    backgroundColor: '#FFF5F5',
    borderRadius: 15,
    padding: 20,
    margin: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  dangerZoneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 16,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD0D0',
  },
  deleteAccountContent: {
    flex: 1,
    marginLeft: 12,
  },
  deleteAccountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  deleteAccountSubtext: {
    fontSize: 12,
    color: '#FF8A8A',
    marginTop: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
  },
  warningHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginTop: 10,
  },
  warningText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  warningSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontWeight: '600',
  },
  warningList: {
    marginBottom: 20,
    paddingLeft: 10,
  },
  warningListItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  confirmationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    fontWeight: '600',
  },
  confirmationInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelModalButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelModalButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteModalButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteModalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});