import { useState } from 'react';
import { UserDto } from '@/api/backend/types';
import { SafeLocation, Location } from '@/api/backend/locations/locationType';
import { JourneyType, generateDefaultJourneyName } from './journeyUtils';

interface UseJourneyFormProps {
  currentUser: UserDto | null;
}

export const useJourneyForm = ({ currentUser }: UseJourneyFormProps) => {
  const [journeyType, setJourneyType] = useState<JourneyType | null>(null);
  const [journeyName, setJourneyName] = useState(generateDefaultJourneyName());
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>(
    currentUser ? [currentUser.id] : []
  );
  const [selectedDestination, setSelectedDestination] = useState<SafeLocation | null>(null);
  const [showDestinationModal, setShowDestinationModal] = useState(false);

  // Manejador de selección de tipo
  const handleSelectJourneyType = (type: JourneyType) => {
    setJourneyType(type);
    
    if (type === 'individual') {
      setSelectedParticipants([currentUser?.id || 0]);
      setSelectedDestination(null);
    } else {
      if (!selectedParticipants.includes(currentUser?.id || 0)) {
        setSelectedParticipants([currentUser?.id || 0]);
      }
    }
  };

  // Toggle participante
  const toggleParticipant = (userId: number) => {
    if (journeyType === 'individual') return;
    if (userId === currentUser?.id) return;

    setSelectedParticipants(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Manejadores de selección de destino
  const handleSelectDestination = (location: SafeLocation | Location) => {
    const safeLocation: SafeLocation = 'name' in location ? location as SafeLocation : {
      id: location.id,
      name: `Ubicación personalizada`,
      address: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
      type: 'custom',
      latitude: location.latitude,
      longitude: location.longitude,
      externalId: undefined
    };
    setSelectedDestination(safeLocation);
    setShowDestinationModal(false);
  };

  return {
    journeyType,
    journeyName,
    selectedParticipants,
    selectedDestination,
    showDestinationModal,
    setJourneyName,
    setShowDestinationModal,
    handleSelectJourneyType,
    toggleParticipant,
    handleSelectDestination,
  };
};
