import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InvitationScreenProps {
  groupType?: string;
  onInvite: () => void;
}

export default function InvitationScreen({ 
  groupType = 'confianza', 
  onInvite 
}: InvitationScreenProps) {
  return (
    <View style={styles.invitationContainer}>
      <View style={styles.invitationIcon}>
        <Ionicons name="people-outline" size={64} color="#7A33CC" />
      </View>

      <Text style={styles.invitationTitle}>¡Invita a más personas!</Text>
      <Text style={styles.invitationSubtitle}>
        Necesitas al menos 2 miembros para usar este grupo de {groupType.toLowerCase()}
      </Text>

      <Pressable style={styles.invitationButton} onPress={onInvite}>
        <Ionicons name="share-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
        <Text style={styles.invitationButtonText}>Generar invitación</Text>
      </Pressable>

      <Text style={styles.invitationHelp}>
        Comparte el enlace de invitación con las personas que quieres añadir al grupo
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  invitationContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 32, 
    backgroundColor: '#FFFFFF'
  },
  invitationIcon: { marginBottom: 24 },
  invitationTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#374151', 
    textAlign: 'center', 
    marginBottom: 8 
  },
  invitationSubtitle: { 
    fontSize: 16, 
    color: '#6B7280', 
    textAlign: 'center', 
    marginBottom: 32, 
    lineHeight: 22 
  },
  invitationButton: {
    backgroundColor: '#7A33CC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 16,
  },
  buttonIcon: { marginRight: 8 },
  invitationButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  invitationHelp: { 
    fontSize: 14, 
    color: '#9CA3AF', 
    textAlign: 'center', 
    lineHeight: 20 
  },
});
