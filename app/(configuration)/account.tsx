import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, SafeAreaView, Pressable } from 'react-native';
import { useUserStore } from '@/lib/storage/useUserStorage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface profileHeaderProps {
  onDelete: () => void;
}

export default function AccountSettingsScreen({onDelete}: profileHeaderProps) {
  const router = useRouter();
  const { user, setUser } = useUserStore();

  const [editable, setEditable] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const handleConfirmDeleteAccount = () => {
    onDelete();
  };

  const handleSave = () => {
    if (!name || !email || !phone) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }

    setUser({
      ...user,
      name,
      email,
      phone,
    });

    setEditable(false);
    Alert.alert('Guardado', 'Tu información ha sido actualizada correctamente.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Información de Cuenta</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={[styles.input, !editable && styles.disabledInput]}
          value={name}
          onChangeText={setName}
          editable={editable}
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
        />
      </View>

      <View style={styles.buttonsContainer}>
        {editable ? (
          <>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.buttonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setEditable(false);
                setName(user?.name || '');
                setEmail(user?.email || '');
                setPhone(user?.phone || '');
              }}
            >
              <Ionicons name="close" size={20} color="#7A33CC" />
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={() => setEditable(true)}>
            <Ionicons name="create-outline" size={20} color="white" />
            <Text style={styles.buttonText}>Editar</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Pressable style={styles.logOut} onPress={handleConfirmDeleteAccount}>
          <Ionicons name="help-circle" size={24} color="#7A33CC" />
          <Text style={styles.settingText}>Eliminar cuenta</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8ff',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#7A33CC',
    marginBottom: 20,
    textAlign: 'center',
  },
  field: {
    marginBottom: 16,
    marginLeft: 20,
    width: 300,
    height: 50,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    fontSize: 24,
    borderWidth: 2,
    borderColor: '#fff',
    textAlign: 'center',
    color: '#fff',
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    color: '#333',
  },
  disabledInput: {
    backgroundColor: '#eee',
    color: '#888',
  },
  buttonsContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#7A33CC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#7A33CC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelButton: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
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
  section: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  logOut: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
});
