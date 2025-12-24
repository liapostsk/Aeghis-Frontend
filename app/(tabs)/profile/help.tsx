import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function HelpScreen() {
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="help-circle" size={48} color="#7A33CC" />
          <Text style={styles.headerTitle}>{t('profile.help.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('profile.help.subtitle')}</Text>
        </View>

        {/* Feedback Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbox-ellipses" size={24} color="#7A33CC" />
            <Text style={styles.sectionTitle}>{t('profile.help.feedback.title')}</Text>
          </View>
          <Text style={styles.sectionDescription}>
            {t('profile.help.feedback.description')}
          </Text>
          <Pressable style={styles.actionButton} onPress={handleFeedbackPress}>
            <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {t('profile.help.feedback.button')}
            </Text>
          </Pressable>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mail" size={24} color="#7A33CC" />
            <Text style={styles.sectionTitle}>{t('profile.help.contact.title')}</Text>
          </View>
          <Text style={styles.sectionDescription}>
            {t('profile.help.contact.description')}
          </Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Ionicons name="bug" size={20} color="#EF4444" />
              <Text style={styles.contactLabel}>{t('profile.help.contact.reportBug')}</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="alert-circle" size={20} color="#F59E0B" />
              <Text style={styles.contactLabel}>{t('profile.help.contact.reportIssue')}</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={styles.contactLabel}>{t('profile.help.contact.askQuestion')}</Text>
            </View>
          </View>
          <Pressable style={styles.actionButton} onPress={handleContactPress}>
            <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {t('profile.help.contact.button')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 45,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
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
    paddingVertical: 8,
  },
  contactLabel: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
  actionButton: {
    backgroundColor: '#7A33CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  comingSoonText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
