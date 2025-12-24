import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import LanguageSelectorModal from './LanguageSelectorModal';

interface settingsSectionProps {
  onDelete: () => void;
  onLogout: () => void;
}

export default function SettingsSection({onDelete, onLogout}: settingsSectionProps) {

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const { t } = useTranslation();
  
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
          <Text style={styles.sectionTitle}>{t('profile.settings.title')}</Text>
        </View>
        <Pressable
          style={styles.settingItem}
          onPress={() => router.push('/(tabs)/profile/account')}
        >
          <Ionicons name="person-circle" size={24} color="#7A33CC" />
          <Text style={styles.settingText}>{t('profile.settings.account')}</Text>
          <Ionicons name="chevron-forward" size={24} color="#7A33CC" />
        </Pressable>

        <Pressable style={styles.settingItem} onPress={() => setShowLanguageModal(true)}>
          <Ionicons name="language" size={24} color="#7A33CC" />
          <Text style={styles.settingText}>{t('profile.settings.language')}</Text>
          <Ionicons name="chevron-forward" size={24} color="#7A33CC" style={styles.chevron} />
        </Pressable>

        <Pressable style={styles.settingItem}>
          <Ionicons name="shield" size={24} color="#7A33CC" />
          <Text style={styles.settingText}>{t('profile.settings.privacy')}</Text>
          <Ionicons name="chevron-forward" size={24} color="#7A33CC" style={styles.chevron} />
        </Pressable>

        <Pressable style={styles.settingItem} onPress={() => router.push('/(tabs)/profile/help')}>
          <Ionicons name="help-circle" size={24} color="#7A33CC" />
          <Text style={styles.settingText}>{t('profile.settings.help')}</Text>
          <Ionicons name="chevron-forward" size={24} color="#7A33CC" style={styles.chevron} />
        </Pressable>
      </View>
      <View style={styles.section}>
        <Pressable style={styles.logOut} onPress={() => setShowLogoutModal(true)}>
          <Ionicons name="help-circle" size={24} color="#7A33CC" />
          <Text style={styles.settingText}>{t('profile.settings.logout')}</Text>
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
            <Text style={styles.modalTitle}>{t('profile.settings.logoutModal.title')}</Text>
            <Text style={styles.modalMessage}>
              {t('profile.settings.logoutModal.message')}
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={handleShowUserInfo}
              >
                <Text style={styles.cancelButtonText}>{t('profile.settings.logoutModal.reviewData')}</Text>
              </Pressable>
              <Pressable
                style={styles.confirmButton}
                onPress={handleConfirmLogout}
              >
                <Text style={styles.confirmButtonText}>{t('profile.settings.logoutModal.confirm')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      
      {/* Modal de selección de idioma */}
      <LanguageSelectorModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
      
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