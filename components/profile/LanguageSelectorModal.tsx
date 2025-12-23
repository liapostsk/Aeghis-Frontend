import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '@/i18n/i18n';

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

type LanguageCode = 'es' | 'en' | 'ca';

export default function LanguageSelectorModal({ visible, onClose }: LanguageSelectorModalProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as LanguageCode;

  const languages: LanguageCode[] = ['es', 'en', 'ca'];

  const handleLanguageChange = async (languageCode: LanguageCode) => {
    await setAppLanguage(languageCode);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="language" size={32} color="#7A33CC" />
            <Text style={styles.modalTitle}>{t('profile.settings.languageModal.title')}</Text>
            <Text style={styles.modalSubtitle}>{t('profile.settings.languageModal.subtitle')}</Text>
          </View>

          {/* Language Options */}
          <View style={styles.languagesContainer}>
            {languages.map((lang) => (
              <Pressable
                key={lang}
                style={[
                  styles.languageOption,
                  currentLanguage === lang && styles.languageOptionActive,
                ]}
                onPress={() => handleLanguageChange(lang)}
              >
                <Text
                  style={[
                    styles.languageName,
                    currentLanguage === lang && styles.languageNameActive,
                  ]}
                >
                  {t(`profile.settings.languageModal.languages.${lang}`)}
                </Text>
                {currentLanguage === lang && (
                  <Ionicons name="checkmark-circle" size={24} color="#7A33CC" />
                )}
              </Pressable>
            ))}
          </View>

          {/* Current Language Indicator */}
          <View style={styles.currentLanguageContainer}>
            <Ionicons name="information-circle" size={16} color="#6B7280" />
            <Text style={styles.currentLanguageText}>
              {t('profile.settings.languageModal.currentLanguage')}:{' '}
              <Text style={styles.currentLanguageBold}>
                {t(`profile.settings.languageModal.languages.${currentLanguage}`)}
              </Text>
            </Text>
          </View>

          {/* Cancel Button */}
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>
              {t('profile.settings.languageModal.cancel')}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  languagesContainer: {
    gap: 12,
    marginBottom: 16,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  languageOptionActive: {
    borderColor: '#7A33CC',
    backgroundColor: '#F3F0FF',
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  languageNameActive: {
    color: '#7A33CC',
  },
  currentLanguageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  currentLanguageText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  currentLanguageBold: {
    fontWeight: '600',
    color: '#1F2937',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '600',
  },
});
