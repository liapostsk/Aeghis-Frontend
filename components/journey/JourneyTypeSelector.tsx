import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export type JourneyType = 'individual' | 'common_destination' | 'personalized';

interface JourneyTypeOption {
  type: JourneyType;
  icon: string;
  title: string;
  description: string;
}

interface JourneyTypeSelectorProps {
  selectedType: JourneyType | null;
  onSelectType: (type: JourneyType) => void;
}

export default function JourneyTypeSelector({ 
  selectedType, 
  onSelectType 
}: JourneyTypeSelectorProps) {
  const { t } = useTranslation();
  
  const JOURNEY_TYPE_OPTIONS: JourneyTypeOption[] = [
    {
      type: 'individual',
      icon: 'person',
      title: t('journeyTypeSelector.types.individual.title'),
      description: t('journeyTypeSelector.types.individual.description')
    },
    {
      type: 'common_destination',
      icon: 'people',
      title: t('journeyTypeSelector.types.commonDestination.title'),
      description: t('journeyTypeSelector.types.commonDestination.description')
    },
    {
      type: 'personalized',
      icon: 'git-network',
      title: t('journeyTypeSelector.types.personalized.title'),
      description: t('journeyTypeSelector.types.personalized.description')
    }
  ];

  const renderTypeOption = (option: JourneyTypeOption) => {
    const isSelected = selectedType === option.type;

    return (
      <Pressable
        key={option.type}
        style={[styles.typeCard, isSelected && styles.typeCardSelected]}
        onPress={() => onSelectType(option.type)}
      >
        <View style={[styles.typeIcon, isSelected && styles.typeIconSelected]}>
          <Ionicons 
            name={option.icon as any} 
            size={28} 
            color={isSelected ? '#7A33CC' : '#6B7280'} 
          />
        </View>
        <View style={styles.typeContent}>
          <Text style={[styles.typeTitle, isSelected && styles.typeTitleSelected]}>
            {option.title}
          </Text>
          <Text style={styles.typeDescription}>{option.description}</Text>
        </View>
        {isSelected && (
          <View style={styles.typeCheck}>
            <Ionicons name="checkmark-circle" size={24} color="#7A33CC" />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('journeyTypeSelector.journeyType')}</Text>
      <Text style={styles.sectionSubtitle}>
        {t('journeyTypeSelector.selectHowToShare')}
      </Text>
      
      {JOURNEY_TYPE_OPTIONS.map(renderTypeOption)}
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
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginTop: 12,
  },
  typeCardSelected: {
    borderColor: '#7A33CC',
    backgroundColor: '#F3E8FF',
  },
  typeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  typeIconSelected: {
    backgroundColor: '#FFFFFF',
  },
  typeContent: { 
    flex: 1,
  },
  typeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  typeTitleSelected: {
    color: '#7A33CC',
  },
  typeDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  typeCheck: {
    marginLeft: 8,
  },
});