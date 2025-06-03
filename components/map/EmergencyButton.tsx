// File: components/map/EmergencyButton.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmergencyButtonProps {
  onPress: () => void;
}

export default function EmergencyButton({ onPress }: EmergencyButtonProps) {
  return (
    <TouchableOpacity style={styles.emergencyButton} onPress={onPress}>
      <Text style={styles.emergencyText}>Emergency</Text>
      <Ionicons name="alert-circle" size={24} color="white" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  emergencyButton: {
    position: 'absolute',
    top: 130,
    left: 15,
    backgroundColor: '#6200ee',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 5,
  },
  emergencyText: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 8,
  },
});
