import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import privacyPolicyData from '@/privacyPolicy.json';

export default function PrivacyPolicyScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('profile.settings.privacy')}</Text>
        
        <View style={styles.contentContainer}>
          <Text style={styles.lastUpdated}>
            Última actualización: {privacyPolicyData.lastUpdated}
          </Text>

          {privacyPolicyData.sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </View>
          ))}

          <View style={styles.footer}>
            {privacyPolicyData.footerText.map((text, index) => (
              <Text key={index} style={styles.footerText}>
                {text}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8ff',
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7A33CC',
    textAlign: 'center',
    marginTop: 50,
    marginHorizontal: 16,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  contentContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    margin: 16,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7A33CC',
    marginBottom: 12,
    lineHeight: 24,
  },
  sectionContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
    textAlign: 'justify',
  },
  footer: {
    marginTop: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    textAlign: 'justify',
    marginBottom: 12,
    fontStyle: 'italic',
  },
});
