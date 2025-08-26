// File: components/profile/SettingsSection.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface settingsSectionProps {
  onDelete: () => void;
  onLogout: () => void;
}

export default function SettingsSection({onDelete, onLogout}: settingsSectionProps) {

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  
  const handleConfirmDeleteAccount = () => {
    onDelete();
  };

  const handleShowUserInfo = () => {
    setShowUserInfo(true);
    setShowLogoutModal(false);
    router.push('/(tabs)/profile/account');
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  return (
    <SafeAreaView>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="settings" size={18} color="#7A33CC" />
          <Text style={styles.sectionTitle}>Configuración</Text>
        </View>

        <Pressable style={styles.settingItem}>
          <Ionicons name="notifications" size={24} color="#7A33CC" />
          <Text style={styles.settingText}>Notificaciones</Text>
          <Ionicons name="chevron-forward" size={24} color="#7A33CC" style={styles.chevron} />
        </Pressable>

        <Pressable
          style={styles.settingItem}
          onPress={() => router.push('/(tabs)/profile/account')}
        >
          <Ionicons name="person-circle" size={24} color="#7A33CC" />
          <Text style={styles.settingText}>Cuenta</Text>
          <Ionicons name="chevron-forward" size={24} color="#7A33CC" />
        </Pressable>

        <Pressable style={styles.settingItem}>
          <Ionicons name="shield" size={24} color="#7A33CC" />
          <Text style={styles.settingText}>Privacidad y Seguridad</Text>
          <Ionicons name="chevron-forward" size={24} color="#7A33CC" style={styles.chevron} />
        </Pressable>

        <Pressable style={styles.settingItem}>
          <Ionicons name="help-circle" size={24} color="#7A33CC" />
          <Text style={styles.settingText}>Ayuda y Soporte</Text>
          <Ionicons name="chevron-forward" size={24} color="#7A33CC" style={styles.chevron} />
        </Pressable>
      </View>
      <View style={styles.section}>
        <Pressable style={styles.logOut} onPress={() => setShowLogoutModal(true)}>
          <Ionicons name="help-circle" size={24} color="#7A33CC" />
          <Text style={styles.settingText}>Cerrar Sessión</Text>
        </Pressable>
      </View>
      {/* Modal de confirmación */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowLogoutModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>¿Estás segura?</Text>
            <Text style={styles.modalMessage}>
              Asegúrate de que tu correo electrónico y número de teléfono sean
              correctos. Si no están actualizados, podrías perder el acceso a
              tu cuenta.
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={handleShowUserInfo}
              >
                <Text style={styles.cancelButtonText}>Revisar datos</Text>
              </Pressable>
              <Pressable
                style={styles.confirmButton}
                onPress={handleConfirmLogout}
              >
                <Text style={styles.confirmButtonText}>Cerrar sesión</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <View style={{ height: 20 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  chevron: {
    marginLeft: 'auto',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#ddd',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#7A33CC',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});