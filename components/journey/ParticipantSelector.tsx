import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserDto } from '@/api/backend/types';
import { JourneyType } from './JourneyTypeSelector';

interface ParticipantSelectorProps {
  journeyType: JourneyType | null;
  members: UserDto[];
  currentUser: UserDto | null;
  selectedParticipants: number[];
  onToggleParticipant: (userId: number) => void;
}

export default function ParticipantSelector({
  journeyType,
  members,
  currentUser,
  selectedParticipants,
  onToggleParticipant
}: ParticipantSelectorProps) {
  // No mostrar selector para trayectos individuales
  if (journeyType === 'individual') return null;

  const renderParticipant = (member: UserDto) => {
    const isSelected = selectedParticipants.includes(member.id);
    const isCurrentUserMember = member.id === currentUser?.id;
    const initials = member.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();

    return (
      <Pressable
        key={member.id}
        style={[
          styles.participantCard,
          isSelected && styles.participantCardSelected,
          isCurrentUserMember && styles.participantCardDisabled
        ]}
        onPress={() => onToggleParticipant(member.id)}
        disabled={isCurrentUserMember}
      >
        <View style={[
          styles.participantAvatar,
          isSelected && styles.participantAvatarSelected
        ]}>
          <Text style={[
            styles.participantAvatarText,
            isSelected && styles.participantAvatarTextSelected
          ]}>
            {initials}
          </Text>
        </View>
        <View style={styles.participantInfo}>
          <Text style={[
            styles.participantName,
            isSelected && styles.participantNameSelected
          ]}>
            {member.name}
            {isCurrentUserMember && ' (Tú)'}
          </Text>
          <Text style={styles.participantPhone}>{member.phone}</Text>
        </View>
        {isSelected && (
          <View style={styles.participantCheck}>
            <Ionicons name="checkmark-circle" size={20} color="#7A33CC" />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Participantes</Text>
      <Text style={styles.sectionSubtitle}>
        Selecciona quién participará en este trayecto
      </Text>
      
      <View style={styles.participantsList}>
        {members.map(renderParticipant)}
      </View>
      
      {selectedParticipants.length === 0 && (
        <Text style={styles.errorText}>
          Debe haber al menos un participante
        </Text>
      )}
      
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {selectedParticipants.length} participante{selectedParticipants.length !== 1 ? 's' : ''} seleccionado{selectedParticipants.length !== 1 ? 's' : ''}
        </Text>
      </View>
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
  participantsList: {
    gap: 8,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  participantCardSelected: {
    borderColor: '#7A33CC',
    backgroundColor: '#F3E8FF',
  },
  participantCardDisabled: {
    opacity: 0.6,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  participantAvatarSelected: {
    backgroundColor: '#7A33CC',
  },
  participantAvatarText: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 12,
  },
  participantAvatarTextSelected: {
    color: '#FFFFFF',
  },
  participantInfo: { 
    flex: 1,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  participantNameSelected: {
    color: '#7A33CC',
  },
  participantPhone: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  participantCheck: {
    marginLeft: 8,
  },
  summary: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  summaryText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
});