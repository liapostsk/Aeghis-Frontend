import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface JourneyCreationHeaderProps {
  onBack: () => void;
  title?: string;
}

export default function JourneyCreationHeader({ 
  onBack, 
  title
}: JourneyCreationHeaderProps) {
  const { t } = useTranslation();
  
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </Pressable>
      <Text style={styles.headerTitle}>{title || t('journeyCreationHeader.createJourney')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: { marginRight: 12 },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
});
