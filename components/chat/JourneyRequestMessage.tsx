import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeLocationModal from '@/components/safeLocations/SafeLocationModal';
import { Location, SelectableLocation, toSafeLocation } from '@/api/backend/locations/locationType';
import { createParticipation } from '@/api/backend/participations/participationApi';
import { joinJourneyParticipation } from '@/api/firebase/journey/participationsService';
import { getJourney } from '@/api/backend/journeys/journeyApi';
import { createLocation } from '@/api/backend/locations/locationsApi';
import { ParticipationDto } from '@/api/backend/participations/participationType';
import { useAuth } from '@clerk/clerk-expo';
import { getCurrentUser } from '@/api/backend/user/userApi';
import * as ExpoLocation from 'expo-location';
import { useTranslation } from 'react-i18next';

interface JourneyRequestMessageProps {
    journeyId: number;
    journeyName: string;
    creatorName: string;
    destination?: string;
    onJoinSuccess?: (journeyId: number) => void;
    onDecline?: (journeyId: number) => void;
    hasUserJoined?: boolean;
}

export default function JourneyRequestMessage({ 
    journeyId, 
    journeyName, 
    creatorName, 
    destination,
    onJoinSuccess,
    onDecline,
    hasUserJoined = false
}: JourneyRequestMessageProps) {
    const { t } = useTranslation();
    const [joining, setJoining] = useState(false);
    const [showDestinationModal, setShowDestinationModal] = useState(false);
    const { getToken } = useAuth();

    const getCurrentLocation = async (): Promise<ExpoLocation.LocationObject | null> => {
        try {
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t('error'), t('chatComponents.journeyRequest.alerts.permissions'));
                return null;
            }

            const location = await ExpoLocation.getCurrentPositionAsync({
                accuracy: ExpoLocation.Accuracy.High,
            });
            return location;
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert(t('error'), t('chatComponents.journeyRequest.alerts.locationError'));
            return null;
        }
    };

    const handleJoinJourney = async (location: SelectableLocation) => {
        try {
            setJoining(true);

            const selectedDestination = toSafeLocation(location);

            // 1. Obtener usuario actual
            const currentUser = await getCurrentUser();
            
            // 2. Obtener ubicación actual del dispositivo
            const deviceLocation = await getCurrentLocation();
            if (!deviceLocation) {
                throw new Error('No se pudo obtener tu ubicación actual');
            }

            // 3. Crear ubicación de origen
            const originLocation: Location = {
                id: 0,
                name: 'Mi ubicación',
                latitude: deviceLocation.coords.latitude,
                longitude: deviceLocation.coords.longitude,
                timestamp: new Date().toISOString(),
            };
            const originLocationId = await createLocation(originLocation);

            // 4. Crear ubicación de destino
            const destLocation: Location = {
                id: 0,
                name: selectedDestination.name,
                latitude: selectedDestination.latitude,
                longitude: selectedDestination.longitude,
                timestamp: new Date().toISOString()
            };
            const destinationLocationId = await createLocation(destLocation);


            // 5. Crear participación en backend
            const participationData: Partial<ParticipationDto> = {
                journeyId: journeyId,
                userId: currentUser.id,
                sharedLocation: true,
                state: 'ACCEPTED',
                sourceId: originLocationId,
                destinationId: destinationLocationId
            };

            const participationId = await createParticipation(participationData as ParticipationDto);
            console.log('✅ Participación creada con ID:', participationId);

            // 6. Registrar participación en Firebase (requiere chatId)
            // journeyId es number, necesitamos groupId para chatId
            const journey = await getJourney(journeyId);
            const chatId = journey.groupId.toString();
            const destinationPosition = selectedDestination ? {
                latitude: selectedDestination.latitude,
                longitude: selectedDestination.longitude,
                timestamp: new Date()
            } : undefined;

        await joinJourneyParticipation(chatId, journeyId.toString(), {
            destination: destinationPosition,
            backendParticipationId: participationId,
            initialState: 'ACCEPTED'
        });
        console.log('Participación sincronizada con Firebaseeeeeeee');

            Alert.alert(
                t('chatComponents.journeyRequest.alerts.success.title'),
                t('chatComponents.journeyRequest.alerts.success.message', { 
                    name: journeyName, 
                    destination: selectedDestination.name 
                }),
                [{ text: 'OK' }]
            );

            onJoinSuccess?.(journeyId);

        } catch (error) {
            Alert.alert(t('error'), t('chatComponents.journeyRequest.alerts.error'));
        } finally {
            setJoining(false);
            setShowDestinationModal(false);
        }
    };

    const handleDecline = () => {
        Alert.alert(
            t('chatComponents.journeyRequest.alerts.decline.title'),
            t('chatComponents.journeyRequest.alerts.decline.message', { name: journeyName }),
            [
                { text: t('chatComponents.joinModal.buttons.cancel'), style: 'cancel' },
                { 
                    text: t('chatComponents.journeyRequest.buttons.decline'), 
                    style: 'destructive',
                    onPress: () => onDecline?.(journeyId)
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name="car" size={20} color="#7A33CC" />
                </View>
                <Text style={styles.title}>Solicitud de Trayecto</Text>
            </View>
            
            <Text style={styles.description}>
                <Text style={styles.creatorName}>{creatorName}</Text> te invita a unirte al trayecto{' '}
                <Text style={styles.journeyName}>"{journeyName}"</Text>
            </Text>

            {destination && (
                <View style={styles.destinationInfo}>
                    <Ionicons name="location" size={16} color="#6B7280" />
                    <Text style={styles.destinationText}>Destino sugerido: {destination}</Text>
                </View>
            )}

            <Text style={styles.journeyId}>ID: {journeyId}</Text>

            {!hasUserJoined ? (
                <View style={styles.actions}>
                    <Pressable style={styles.declineButton} onPress={handleDecline}>
                        <Ionicons name="close-circle" size={16} color="#EF4444" />
                        <Text style={styles.declineText}>Declinar</Text>
                    </Pressable>
                    
                    <Pressable 
                        style={styles.joinButton} 
                        onPress={() => setShowDestinationModal(true)}
                        disabled={joining}
                    >
                        {joining ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                                <Text style={styles.joinText}>Unirse</Text>
                            </>
                        )}
                    </Pressable>
                </View>
            ) : (
                <View style={styles.joinedStatus}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.joinedText}>Te has unido al trayecto</Text>
                </View>
            )}

            {/* Modal de selección de destino */}
            <SafeLocationModal
                visible={showDestinationModal}
                onClose={() => setShowDestinationModal(false)}
                onSelectLocation={handleJoinJourney}
                title="Selecciona tu destino para el trayecto"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F3E8FF',
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#7A33CC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#7A33CC',
    },
    description: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
        marginBottom: 12,
    },
    creatorName: {
        fontWeight: '600',
        color: '#7A33CC',
    },
    journeyName: {
        fontWeight: '600',
        color: '#1F2937',
    },
    destinationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 4,
    },
    destinationText: {
        fontSize: 13,
        color: '#6B7280',
        flex: 1,
    },
    journeyId: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 12,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    declineButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#EF4444',
        gap: 6,
    },
    declineText: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '600',
    },
    joinButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#7A33CC',
        borderRadius: 8,
        gap: 6,
    },
    joinText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    joinedStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 6,
    },
    joinedText: {
        color: '#10B981',
        fontSize: 14,
        fontWeight: '600',
    },
});