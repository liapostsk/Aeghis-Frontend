import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ActivityIndicator, Alert } from 'react-native';
/*
import QRCode from 'react-native-qrcode-svg'; // npm i react-native-qrcode-svg
import * as Clipboard from 'expo-clipboard';
import { createGroupWithInvite } from '../../services/groupService';
import { useTokenStore } from '../../lib/auth/tokenStore';
*/

type Props = { 
    visible: boolean;
    onClose: () => void; 
    type?: 'trusted' | 'temporal' | 'companion';
};

export default function CreateGroupModal({ visible, onClose, type }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState<{ code: string; deepLink: string } | null>(null);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Crear grupo</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre del grupo"
            value={name}
            onChangeText={setName}
          />
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <>
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  // Aquí iría la lógica para crear el grupo y generar el código de invitación
                  setLoading(true);
                  // Simulación de creación de grupo
                  setTimeout(() => {
                    setInvite({ code: '123456', deepLink: 'aegis://group/123456' });
                    setLoading(false);
                  }, 2000);
                }}
              >
                <Text style={styles.buttonText}>Crear grupo</Text>
              </TouchableOpacity>
              {invite && (
                <View style={styles.inviteContainer}>
                  <Text style={styles.inviteCode}>Código de invitación: {invite.code}</Text>
                  <Text style={styles.inviteLink}>Deep Link: {invite.deepLink}</Text>
                </View>
              )}
            </>
          )}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#7A33CC',
    padding: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inviteContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  inviteCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  inviteLink: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});