import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface JourneyNameInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function JourneyNameInput({ 
  value, 
  onChangeText, 
  placeholder 
}: JourneyNameInputProps) {
  const { t } = useTranslation();
  
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('journeyNameInput.journeyName')}</Text>
      <View style={styles.inputContainer}>
        <Ionicons name="navigate" size={20} color="#7A33CC" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder || t('journeyNameInput.placeholder')}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor="#9CA3AF"
          maxLength={50}
          returnKeyType="done"
        />
      </View>
      {value.length > 40 && (
        <Text style={styles.charCount}>
          {value.length}/50 {t('journeyNameInput.characters')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    marginTop: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
});