import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { JourneyDto } from '@/api/backend/journeys/journeyType';
import { ParticipationDto } from '@/api/backend/participations/participationType';
import { useTranslation } from 'react-i18next';

interface JourneyBannerProps {
  activeJourney: JourneyDto;
  userParticipation: ParticipationDto | null;
  onJoinJourney: () => void;
}

export default function JourneyBanner({ 
  activeJourney, 
  userParticipation, 
  onJoinJourney 
}: JourneyBannerProps) {
  const { t } = useTranslation();
  
  const isInProgress = activeJourney.state === 'IN_PROGRESS';
  const isPending = activeJourney.state === 'PENDING';
  
  // Solo mostrar si está PENDING o IN_PROGRESS
  if (!isInProgress && !isPending) return null;

  const handleJourneyAction = () => {
    const journeyInfo = {
      journeyId: activeJourney.id,
      journeyType: activeJourney.journeyType,
      state: activeJourney.state,
      groupId: activeJourney.groupId,
      startDate: new Date(activeJourney.iniDate).toLocaleDateString()
    };
    
    // Si el usuario ya está participando, llevarlo al mapa
    if (userParticipation) {
      console.log('Usuario ya está en el journey, llevando al mapa:', journeyInfo);
      // Navegar al mapa (tab principal)
      router.push('/(tabs)');
    } else {
      console.log('Usuario quiere unirse al journey:', journeyInfo);
      // Abrir modal para unirse al journey
      onJoinJourney();
    }
  };

  const getJourneyDisplayInfo = () => {
    const typeKey = {
      'INDIVIDUAL': 'individual',
      'COMMON_DESTINATION': 'common',
      'PERSONALIZED': 'personalized'
    }[activeJourney.journeyType] || 'individual';
    
    const typeDisplayName = t(`chatComponents.journeyBanner.types.${typeKey}`);

    // Si el usuario ya está participando
    if (userParticipation) {
      if (isInProgress) {
        return {
          icon: 'navigate-circle' as const,
          title: t('chatComponents.journeyBanner.participating.inProgress.title', { type: typeDisplayName }),
          subtitle: t('chatComponents.journeyBanner.participating.inProgress.subtitle'),
          color: '#10B981',
          bgColor: '#ECFDF5',
          buttonText: t('chatComponents.journeyBanner.buttons.viewMap')
        };
      } else {
        return {
          icon: 'time' as const,
          title: t('chatComponents.journeyBanner.participating.pending.title', { type: typeDisplayName }),
          subtitle: t('chatComponents.journeyBanner.participating.pending.subtitle'),
          color: '#7A33CC',
          bgColor: '#F3E8FF',
          buttonText: t('chatComponents.journeyBanner.buttons.viewMap')
        };
      }
    }

    if (isInProgress) {
      return {
        icon: 'navigate-circle' as const,
        title: t('chatComponents.journeyBanner.notParticipating.inProgress.title', { type: typeDisplayName }),
        subtitle: t('chatComponents.journeyBanner.notParticipating.inProgress.subtitle'),
        color: '#10B981',
        bgColor: '#ECFDF5',
        buttonText: t('chatComponents.journeyBanner.buttons.join')
      };
    } else {
      return {
        icon: 'time' as const,
        title: t('chatComponents.journeyBanner.notParticipating.pending.title', { type: typeDisplayName }),
        subtitle: t('chatComponents.journeyBanner.notParticipating.pending.subtitle'),
        color: '#F59E0B',
        bgColor: '#FFFBEB',
        buttonText: t('chatComponents.journeyBanner.buttons.join')
      };
    }
  };

  const displayInfo = getJourneyDisplayInfo();

  return (
    <View style={styles.journeyBannerContainer}>
      <Pressable style={styles.journeyBannerButton} onPress={handleJourneyAction}>
        <View style={styles.journeyBannerContent}>
          <View style={[styles.journeyIconContainer, { backgroundColor: displayInfo.bgColor }]}>
            <Ionicons name={displayInfo.icon} size={24} color={displayInfo.color} />
          </View>
          
          <View style={styles.journeyTextContainer}>
            <Text style={styles.journeyBannerTitle}>
              {displayInfo.title}
            </Text>
            <Text style={styles.journeyBannerSubtitle}>
              {displayInfo.subtitle}
            </Text>
          </View>
          
          <View style={styles.journeyActionContainer}>
            <Text style={styles.joinButtonText}>{displayInfo.buttonText}</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Journey Banner - Fijo arriba del chat
  journeyBannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  journeyBannerButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7A33CC',
    overflow: 'hidden',
  },
  journeyBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  journeyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  journeyTextContainer: {
    flex: 1,
  },
  journeyBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  journeyBannerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  journeyActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#7A33CC',
    borderRadius: 8,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
  },
});