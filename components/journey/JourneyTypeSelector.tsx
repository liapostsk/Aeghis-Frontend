import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

const JOURNEY_TYPE_OPTIONS: JourneyTypeOption[] = [
  {
    type: 'individual',
    icon: 'person',
    title: 'Individual',
    description: 'Solo tú compartirás tu ubicación con el grupo'
  },
  {
    type: 'common_destination',
    icon: 'people',
    title: 'Grupal con destino común',
    description: 'Todos comparten ubicación hacia el mismo destino'
  },
  {
    type: 'personalized',
    icon: 'git-network',
    title: 'Grupal personalizado',
    description: 'Cada participante tiene su propio destino'
  }
];

export default function JourneyTypeSelector({ 
  selectedType, 
  onSelectType 
}: JourneyTypeSelectorProps) {
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
      <Text style={styles.sectionTitle}>Tipo de trayecto</Text>
      <Text style={styles.sectionSubtitle}>
        Selecciona cómo quieres compartir las ubicaciones
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