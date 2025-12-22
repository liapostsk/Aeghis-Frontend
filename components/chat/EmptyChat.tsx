import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function EmptyChat() {
  const { t } = useTranslation();
  
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>{t('chatComponents.empty.title')}</Text>
      <Text style={styles.emptySubtext}>{t('chatComponents.empty.subtitle')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#374151', marginTop: 12, fontWeight: '500' },
  emptySubtext: { fontSize: 14, color: '#6B7280', marginTop: 4 },
});
