import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
    ActivityIndicator,
    StatusBar,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserDto } from '@/api/types';
import { Group } from '@/api/group/groupType';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { getGroupById } from '@/api/group/groupApi';
import { getUser, getCurrentUser } from '@/api/user/userApi';
import { Location, SafeLocation } from '@/api/locations/locationType';
import { JourneyDto, JourneyTypes, JourneyStates } from '@/api/journeys/journeyType';
import { ParticipationDto } from '@/api/participations/participationType';
import { createJourney } from '@/api/journeys/journeyApi';
import { createParticipation } from '@/api/participations/participationApi';
import { createLocation } from '@/api/locations/locationsApi';
import { sendMessageFirebase } from '@/api/firebase/chat/chatService';
import * as ExpoLocation from 'expo-location';
import SafeLocationModal from '@/components/safeLocations/SafeLocationModal';

type JourneyType = 'individual' | 'common_destination' | 'personalized';

interface ParticipantLocation {
    userId: number;
    userName: string;
    origin: string;
    destination: string;
}

export default function journey() {
    const { groupId } = useLocalSearchParams<{ groupId: string }>();
    const { getToken } = useAuth();
    const setToken = useTokenStore((state) => state.setToken);

    // Estados principales
    const [group, setGroup] = useState<Group | null>(null);
    const [members, setMembers] = useState<UserDto[]>([]);
    const [currentUser, setCurrentUser] = useState<UserDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    
    // Estados del trayecto
    const [journeyType, setJourneyType] = useState<JourneyType | null>(null);
    const [journeyName, setJourneyName] = useState('');
    const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
    const [creationStep, setCreationStep] = useState('');
    const [currentLocation, setCurrentLocation] = useState<ExpoLocation.LocationObject | null>(null);
    const [selectedDestination, setSelectedDestination] = useState<SafeLocation | null>(null);
    const [showDestinationModal, setShowDestinationModal] = useState(false);

    // Cargar datos del grupo
    useEffect(() => {
        let mounted = true;

        const loadGroupData = async () => {
            try {
                setLoading(true);
                const token = await getToken();
                setToken(token);

                const id = Number(groupId);
                if (!id || Number.isNaN(id)) {
                    throw new Error('Invalid group id');
                }

                const [groupData, userData] = await Promise.all([
                    getGroupById(id),
                    getCurrentUser()
                ]);

                if (!mounted) return;

                setGroup(groupData);
                setCurrentUser(userData);

                // Cargar miembros
                const memberPromises = groupData.membersIds.map(memberId => getUser(memberId));
                const loadedMembers = await Promise.all(memberPromises);
                setMembers(loadedMembers);

                // Auto-seleccionar al usuario actual
                setSelectedParticipants([userData.id]);

                // Generar nombre por defecto
                const now = new Date();
                const defaultName = `Trayecto ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                setJourneyName(defaultName);

            } catch (error) {
                console.error('Error loading group:', error);
                Alert.alert('Error', 'No se pudo cargar la información del grupo');
                router.back();
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadGroupData();
        return () => { mounted = false; };
    }, [groupId]);

    // Función para obtener ubicación actual del dispositivo
    const getCurrentLocation = async (): Promise<ExpoLocation.LocationObject | null> => {
        try {
            // Verificar permisos
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu ubicación para crear el trayecto');
                return null;
            }

            // Obtener ubicación actual
            const location = await ExpoLocation.getCurrentPositionAsync({
                accuracy: ExpoLocation.Accuracy.High,
            });
            setCurrentLocation(location);
            return location;
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
            return null;
        }
    };

    // Función para crear registro de ubicación en backend
    const createLocationRecord = async (location: ExpoLocation.LocationObject): Promise<number | null> => {
        try {
            const locationData: Location = {
                id: 0, // Se asignará en el backend
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                timestamp: new Date().toISOString(),
            };

            const createdLocationId = await createLocation(locationData);
            return createdLocationId;
        } catch (error) {
            console.error('Error creating location record:', error);
            return null;
        }
    };

    // Función para enviar mensaje de solicitud de trayecto al chat
    const sendJourneyRequestMessage = async (journeyName: string, destination: string) => {
        try {
            if (!group?.id) return;

            const message = `🚀 ${currentUser?.name || 'Usuario'} ha creado un nuevo trayecto grupal: "${journeyName}"
📍 Destino: ${destination}

¡Únete si quieres participar en este trayecto!`;

            await sendMessageFirebase(group.id.toString(), message);
        } catch (error) {
            console.error('Error sending journey request message:', error);
        }
    };

    // Manejadores de selección de destino
    const handleSelectDestination = (location: SafeLocation) => {
        setSelectedDestination(location);
        setShowDestinationModal(false);
    };

    const handleCloseDestinationModal = () => {
        setShowDestinationModal(false);
    };

    // Manejadores de selección de tipo de trayecto
    const handleSelectJourneyType = (type: JourneyType) => {
        setJourneyType(type);
        
        // Reset states según el tipo
        if (type === 'individual') {
            // Solo el usuario actual puede participar
            setSelectedParticipants([currentUser?.id || 0]);
            // Para individual no se necesita destino predefinido
            setSelectedDestination(null);
        } else {
            // Mantener selección actual para tipos grupales
            if (!selectedParticipants.includes(currentUser?.id || 0)) {
                setSelectedParticipants([currentUser?.id || 0]);
            }
            // Mantener destino seleccionado para grupales
        }
    };

    // Toggle participante
    const toggleParticipant = (userId: number) => {
        if (journeyType === 'individual') return; // No permitir cambios en individual
        
        // El usuario actual siempre debe estar incluido
        if (userId === currentUser?.id) return;

        setSelectedParticipants(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    // Actualizar ubicaciones de participante (simplificado para flujo automático)
    const updateParticipantLocation = (userId: number, field: 'origin' | 'destination', value: string) => {
        // Ya no necesario con ubicación automática del dispositivo
        console.log('updateParticipantLocation - funcionalidad obsoleta con ubicación automática');
    };

    // Validación del formulario
    const validateForm = (): boolean => {
        if (!journeyType) {
            Alert.alert('Error', 'Selecciona un tipo de trayecto');
            return false;
        }

        if (!journeyName.trim()) {
            Alert.alert('Error', 'Ingresa un nombre para el trayecto');
            return false;
        }

        if (selectedParticipants.length === 0) {
            Alert.alert('Error', 'Debe haber al menos un participante');
            return false;
        }

                // Validación de destino seleccionado para trayectos grupales
        if (journeyType !== 'individual' && !selectedDestination) {
            Alert.alert('Error', 'Selecciona un destino para el trayecto grupal');
            return false;
        }

        return true;
    };

    // Crear trayecto
    const handleCreateJourney = async () => {
        if (!validateForm()) return;

        try {
            setCreating(true);

            // 1. Crear DTO de trayecto
            setCreationStep('Creando trayecto...');
            const journeyData: Partial<JourneyDto> = {
                groupId: Number(groupId),
                type: journeyType === 'individual' ? JourneyTypes.INDIVIDUAL : 
                      journeyType === 'common_destination' ? JourneyTypes.COMMON_DESTINATION : JourneyTypes.PERSONALIZED,
                state: JourneyStates.PENDING, // Inicialmente pendiente
                iniDate: new Date().toISOString(),
                participantsIds: selectedParticipants
            };

            // 2. Crear el journey en el backend
            const journeyId = await createJourney(journeyData as JourneyDto);
            console.log('Journey creado con ID:', journeyId);

            // 3. Obtener ubicación actual del dispositivo para el usuario que crea el trayecto
            if (selectedParticipants.includes(currentUser?.id || 0)) {
                setCreationStep('Obteniendo tu ubicación actual...');
                const deviceLocation = await getCurrentLocation();
                if (!deviceLocation) {
                    throw new Error('No se pudo obtener la ubicación actual');
                }
            }

            // 4. Crear ubicaciones de destino
            setCreationStep('Configurando destino...');
            let destinationLocationId: number | undefined;
            
            if (selectedDestination) {
                const destLoc: Location = {
                    id: 0,
                    latitude: selectedDestination.latitude,
                    longitude: selectedDestination.longitude,
                    timestamp: new Date().toISOString()
                };
                destinationLocationId = await createLocationRecord(currentLocation!);
            }

            // 5. Crear participaciones para cada participante
            setCreationStep('Configurando participantes...');
            const participationPromises = selectedParticipants.map(async (participantId) => {
                const user = members.find(m => m.id === participantId);
                if (!user) return;

                // 6. Crear ubicación de origen si es el usuario actual
                let originLocationId: number | undefined;
                
                if (participantId === currentUser?.id && currentLocation) {
                    originLocationId = await createLocationRecord(currentLocation);
                }

                // 7. Crear participación
                const participationData: Partial<ParticipationDto> = {
                    journeyId: journeyId,
                    userId: participantId,
                    sharedLocation: participantId === currentUser?.id, // Solo el creador comparte inicialmente
                    participationState: participantId === currentUser?.id ? 'ACCEPTED' : 'PENDING',
                    sourceId: originLocationId || 0, // Solo el creador tiene origen inicialmente
                    destinationId: destinationLocationId || 0
                };

                await createParticipation(participationData as ParticipationDto);
            });

            await Promise.all(participationPromises);

            // 7. Verificar si hay más de un miembro listo para activar el trayecto
            const readyMembers = selectedParticipants.filter(id => id === currentUser?.id).length;
            
            // En una implementación real, harías una llamada para actualizar el estado del journey
            // if (readyMembers > 1) {
            //     await updateJourney({ ...journeyData, id: journeyId, status: 'ACTIVE' });
            // }

            // 8. Para trayectos grupales, enviar mensaje al chat
            if (journeyType !== 'individual' && selectedDestination) {
                setCreationStep('Notificando al grupo...');
                await sendJourneyRequestMessage(journeyName, selectedDestination.address);
            }

            // 9. Éxito: Mostrar mensaje y regresar
            Alert.alert(
                '¡Trayecto creado!',
                `El trayecto "${journeyName}" se ha creado exitosamente. ` +
                (journeyType === 'individual' 
                    ? 'Puedes iniciarlo cuando estés listo.'
                    : 'Los otros participantes recibirán una notificación para unirse.'
                ),
                [
                    {
                        text: 'OK',
                        onPress: () => router.back()
                    }
                ]
            );

        } catch (error) {
            console.error('Error creating journey:', error);
            Alert.alert(
                'Error', 
                'No se pudo crear el trayecto. Verifica tu conexión e inténtalo de nuevo.'
            );
        } finally {
            setCreating(false);
            setCreationStep('');
        }
    };

    // Renderizar opciones de tipo de trayecto
    const renderJourneyTypeOption = (
        type: JourneyType,
        icon: string,
        title: string,
        description: string
    ) => {
        const isSelected = journeyType === type;

        return (
            <Pressable
                key={type}
                style={[styles.typeCard, isSelected && styles.typeCardSelected]}
                onPress={() => handleSelectJourneyType(type)}
            >
                <View style={[styles.typeIcon, isSelected && styles.typeIconSelected]}>
                    <Ionicons 
                        name={icon as any} 
                        size={28} 
                        color={isSelected ? '#7A33CC' : '#6B7280'} 
                    />
                </View>
                <View style={styles.typeContent}>
                    <Text style={[styles.typeTitle, isSelected && styles.typeTitleSelected]}>
                        {title}
                    </Text>
                    <Text style={styles.typeDescription}>{description}</Text>
                </View>
                {isSelected && (
                    <View style={styles.typeCheck}>
                        <Ionicons name="checkmark-circle" size={24} color="#7A33CC" />
                    </View>
                )}
            </Pressable>
        );
    };

    // Renderizar selector de participantes
    const renderParticipantSelector = () => {
        if (journeyType === 'individual') return null;

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Participantes</Text>
                <Text style={styles.sectionSubtitle}>
                    Selecciona quién participará en este trayecto
                </Text>
                
                <View style={styles.participantsList}>
                    {members.map(member => {
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
                                onPress={() => toggleParticipant(member.id)}
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
                    })}
                </View>
            </View>
        );
    };

    // Renderizar campos de ubicación
    const renderLocationFields = () => {
        if (!journeyType) return null;

        // Para trayectos grupales, mostrar selector de destino
        if (journeyType !== 'individual') {
            return (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Seleccionar destino</Text>
                    <Text style={styles.sectionSubtitle}>
                        El origen será automáticamente tu ubicación actual
                    </Text>
                    
                    <Pressable
                        style={styles.destinationSelector}
                        onPress={() => setShowDestinationModal(true)}
                    >
                        <Ionicons name="location" size={20} color="#7A33CC" />
                        <View style={styles.destinationInfo}>
                            <Text style={styles.destinationText}>
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
                </View>
            );
        }

        return null;
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#7A33CC" />
                <Text style={styles.loadingText}>Cargando información...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#7A33CC" />
            
            <SafeAreaView style={styles.topArea}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Crear trayecto</Text>
                </View>
            </SafeAreaView>

            {/* Contenido principal */}
            <View style={styles.body}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Información del grupo */}
                    <View style={styles.groupBanner}>
                        <View style={styles.groupBannerIcon}>
                            <Ionicons name="people" size={24} color="#7A33CC" />
                        </View>
                        <View style={styles.groupBannerInfo}>
                            <Text style={styles.groupBannerTitle}>{group?.name}</Text>
                            <Text style={styles.groupBannerSubtitle}>
                                {members.length} miembro{members.length !== 1 ? 's' : ''}
                            </Text>
                        </View>
                    </View>

                    {/* Nombre del trayecto */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Nombre del trayecto</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="navigate" size={20} color="#7A33CC" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Trayecto al trabajo"
                                value={journeyName}
                                onChangeText={setJourneyName}
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>

                    {/* Tipo de trayecto */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Tipo de trayecto</Text>
                        <Text style={styles.sectionSubtitle}>
                            Selecciona cómo quieres compartir las ubicaciones
                        </Text>
                        
                        {renderJourneyTypeOption(
                            'individual',
                            'person',
                            'Individual',
                            'Solo tú compartirás tu ubicación con el grupo'
                        )}
                        
                        {renderJourneyTypeOption(
                            'common_destination',
                            'people',
                            'Grupal con destino común',
                            'Todos comparten ubicación hacia el mismo destino'
                        )}
                        
                        {renderJourneyTypeOption(
                            'personalized',
                            'git-network',
                            'Grupal personalizado',
                            'Cada participante tiene su propio destino'
                        )}
                    </View>

                    {/* Selector de participantes */}
                    {renderParticipantSelector()}

                    {/* Campos de ubicación */}
                    {renderLocationFields()}

                    {/* Espacio para el botón */}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Botón de crear */}
                <View style={styles.buttonContainer}>
                    <Pressable
                        style={[
                            styles.createButton,
                            (!journeyType || creating || (journeyType !== 'individual' && !selectedDestination)) && styles.createButtonDisabled
                        ]}
                        onPress={handleCreateJourney}
                        disabled={!journeyType || creating || (journeyType !== 'individual' && !selectedDestination)}
                    >
                        {creating ? (
                            <>
                                <ActivityIndicator color="#FFFFFF" />
                                <Text style={styles.createButtonText}>
                                    {creationStep || 'Creando trayecto...'}
                                </Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                <Text style={styles.createButtonText}>Crear trayecto</Text>
                            </>
                        )}
                    </Pressable>
                </View>
            </View>

            {/* Modal de selección de destino */}
            <SafeLocationModal
                visible={showDestinationModal}
                onClose={handleCloseDestinationModal}
                onSelectLocation={handleSelectDestination}
                title="Seleccionar destino del trayecto"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#7A33CC' },
    topArea: { backgroundColor: '#7A33CC' },
    body: { flex: 1, backgroundColor: '#F9FAFB' },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    loadingText: { color: '#6B7280', marginTop: 12, fontSize: 14 },

    // Header
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: { marginRight: 12 },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '600',
        flex: 1,
    },

    // Scroll Content
    scrollContent: {
        paddingBottom: 20,
    },

    // Group Banner
    groupBanner: {
        margin: 16,
        marginBottom: 8,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    groupBannerIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3E8FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    groupBannerInfo: { flex: 1 },
    groupBannerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    groupBannerSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },

    // Section
    section: {
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

    // Input
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

    // Type Card
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
    typeContent: { flex: 1 },
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

    // Participants
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
    participantInfo: { flex: 1 },
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

    // Location Card
    locationCard: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginTop: 12,
    },
    locationCardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
    },

    // Button
    buttonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    createButton: {
        backgroundColor: '#7A33CC',
        paddingVertical: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    createButtonDisabled: {
        backgroundColor: '#D1D5DB',
        opacity: 0.6,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    
    // Destination Selector
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
    destinationInfo: {
        flex: 1,
    },
    destinationText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '600',
    },
    destinationAddress: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
});