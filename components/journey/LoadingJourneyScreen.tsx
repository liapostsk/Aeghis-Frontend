import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';

interface LoadingJourneyScreenProps {
  message?: string;
}

export default function LoadingJourneyScreen({ 
  message
}: LoadingJourneyScreenProps) {
  const { t } = useTranslation();
  
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#7A33CC" />
      <Text style={styles.loadingText}>
        {message || t('loadingJourneyScreen.defaultMessage')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: { 
    color: '#6B7280', 
    marginTop: 12, 
    fontSize: 14 
  },
});
