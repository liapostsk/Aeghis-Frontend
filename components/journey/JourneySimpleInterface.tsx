import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface JourneySimpleInterfaceProps {
  onStartJourney: () => void;
  onLayout?: (event: any) => void;
}

export default function JourneySimpleInterface({ onStartJourney, onLayout }: JourneySimpleInterfaceProps) {
  const { t } = useTranslation();
  
  return (
    <View
      style={styles.sheetContent}
      onLayout={onLayout}
    >
      <Text style={styles.simpleText}>
        {t('journeySimple.noTripMessage')}
      </Text>
      
      <Pressable style={styles.simpleButton} onPress={onStartJourney}>
        <Text style={styles.simpleButtonText}>{t('journeySimple.startJourney')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    padding: 20,
    paddingBottom: 40,
  },
  simpleText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  simpleButton: {
    backgroundColor: '#7A33CC',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  simpleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
