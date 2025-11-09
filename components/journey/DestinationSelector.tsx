import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLocation } from '@/api/backend/locations/locationType';

interface DestinationSelectorProps {
  selectedDestination: SafeLocation | null;
  onPress: () => void;
  isRequired?: boolean;
}

export default function DestinationSelector({ 
  selectedDestination, 
  onPress, 
  isRequired = false 
}: DestinationSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        Seleccionar destino {isRequired && <Text style={styles.required}>*</Text>}
      </Text>
      <Text style={styles.sectionSubtitle}>
        El origen será automáticamente tu ubicación actual
      </Text>
      
      <Pressable
        style={[
          styles.destinationSelector,
          !selectedDestination && isRequired && styles.destinationSelectorError
        ]}
        onPress={onPress}
      >
        <Ionicons 
          name="location" 
          size={20} 
          color={selectedDestination ? "#7A33CC" : "#9CA3AF"} 
        />
        <View style={styles.destinationInfo}>
          <Text style={[
            styles.destinationText,
            !selectedDestination && styles.destinationTextPlaceholder
          ]}>
            {selectedDestination ? selectedDestination.name : 'Seleccionar destino'}
          </Text>
          {selectedDestination && (
            <Text style={styles.destinationAddress}>
              {selectedDestination.address}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </Pressable>
      
      {!selectedDestination && isRequired && (
        <Text style={styles.errorText}>
          Selecciona un destino para continuar
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
  required: {
    color: '#EF4444',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  destinationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  destinationSelectorError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  destinationInfo: {
    flex: 1,
  },
  destinationText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  destinationTextPlaceholder: {
    color: '#9CA3AF',
    fontWeight: '400',
  },
  destinationAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
});