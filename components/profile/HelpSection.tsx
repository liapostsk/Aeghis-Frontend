import { View, Text, StyleSheet, Pressable, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function HelpSection() {
  const { t } = useTranslation();

  const handleFeedbackPress = () => {
    // TODO: Reemplazar con el link de la encuesta real
    Alert.alert(
      t('profile.help.feedback.comingSoon.title'),
      t('profile.help.feedback.comingSoon.message')
    );
  };

  const handleContactPress = async () => {
    const email = 'support@aegis.com'; // TODO: Reemplazar con el email real
    const subject = t('profile.help.contact.emailSubject');
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          t('profile.help.contact.error.title'),
          t('profile.help.contact.error.message', { email })
        );
      }
    } catch (error) {
      Alert.alert(
        t('profile.help.contact.error.title'),
        t('profile.help.contact.error.message', { email })
      );
    }
  };

  return (
    <View>
      {/* Feedback Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="chatbox-ellipses" size={20} color="#7A33CC" />
          <Text style={styles.sectionTitle}>{t('profile.help.feedback.title')}</Text>
        </View>
        <Text style={styles.sectionDescription}>
          {t('profile.help.feedback.description')}
        </Text>
        <Pressable style={styles.actionButton} onPress={handleFeedbackPress}>
          <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>
            {t('profile.help.feedback.button')}
          </Text>
        </Pressable>
      </View>

      {/* Contact Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="mail" size={20} color="#7A33CC" />
          <Text style={styles.sectionTitle}>{t('profile.help.contact.title')}</Text>
        </View>
        <Text style={styles.sectionDescription}>
          {t('profile.help.contact.description')}
        </Text>
        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <Ionicons name="bug" size={18} color="#EF4444" />
            <Text style={styles.contactLabel}>{t('profile.help.contact.reportBug')}</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="alert-circle" size={18} color="#F59E0B" />
            <Text style={styles.contactLabel}>{t('profile.help.contact.reportIssue')}</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="information-circle" size={18} color="#3B82F6" />
            <Text style={styles.contactLabel}>{t('profile.help.contact.askQuestion')}</Text>
          </View>
        </View>
        <Pressable style={styles.actionButton} onPress={handleContactPress}>
          <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>
            {t('profile.help.contact.button')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  contactInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  contactLabel: {
    fontSize: 13,
    color: '#333',
    marginLeft: 10,
  },
  actionButton: {
    backgroundColor: '#7A33CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
