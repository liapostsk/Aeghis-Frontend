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
import { Location } from '@/api/locations/locationType';
import { JourneyDto, JourneyTypes, JourneyStates } from '@/api/journeys/journeyType';
import { ParticipationDto } from '@/api/participations/participationType';
import { createJourney } from '@/api/journeys/journeyApi';
import { createParticipation } from '@/api/participations/participationApi';
import { createLocation } from '@/api/locations/locationsApi';

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
    const [commonDestination, setCommonDestination] = useState('');
    const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
    const [participantLocations, setParticipantLocations] = useState<Record<number, ParticipantLocation>>({});
    const [creationStep, setCreationStep] = useState('');

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

    // Manejadores de selección de tipo de trayecto
    const handleSelectJourneyType = (type: JourneyType) => {
        setJourneyType(type);
        
        // Reset states según el tipo
        if (type === 'individual') {
            // Solo el usuario actual puede participar
            setSelectedParticipants([currentUser?.id || 0]);
        } else {
            // Mantener selección actual para tipos grupales
            if (!selectedParticipants.includes(currentUser?.id || 0)) {
                setSelectedParticipants([currentUser?.id || 0]);
            }
        }
        
        setCommonDestination('');
        setParticipantLocations({});
    };

    // Toggle participante
    const toggleParticipant = (userId: number) => {
        if (journeyType === 'individual') return; // No permitir cambios en individual
        
        // El usuario actual siempre debe estar incluido
        if (userId === currentUser?.id) return;

        setSelectedParticipants(prev => {
            if (prev.includes(userId)) {
                // Remover locations del participante
                const newLocations = { ...participantLocations };
                delete newLocations[userId];
                setParticipantLocations(newLocations);
                
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    // Actualizar ubicaciones de participante
    const updateParticipantLocation = (userId: number, field: 'origin' | 'destination', value: string) => {
        const user = members.find(m => m.id === userId);
        if (!user) return;

        setParticipantLocations(prev => ({
            ...prev,
            [userId]: {
                ...prev[userId],
                userId,
                userName: user.name,
                origin: field === 'origin' ? value : (prev[userId]?.origin || ''),
                destination: field === 'destination' ? value : (prev[userId]?.destination || ''),
            }
        }));
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

        // Validaciones específicas por tipo
        if (journeyType === 'common_destination') {
            if (!commonDestination.trim()) {
                Alert.alert('Error', 'Ingresa un destino común');
                return false;
            }
        }

        if (journeyType === 'personalized') {
            for (const participantId of selectedParticipants) {
                const location = participantLocations[participantId];
                if (!location?.origin?.trim() || !location?.destination?.trim()) {
                    const user = members.find(m => m.id === participantId);
                    Alert.alert('Error', `Completa origen y destino para ${user?.name || 'todos los participantes'}`);
                    return false;
                }
            }
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

            // 3. Crear participaciones y ubicaciones para cada participante
            setCreationStep('Configurando participantes...');
            const participationPromises = selectedParticipants.map(async (participantId) => {
                const user = members.find(m => m.id === participantId);
                if (!user) return;

                // 4. Determinar origen y destino según el tipo de trayecto
                let originLocation: string;
                let destinationLocation: string;

                if (journeyType === 'individual') {
                    // Para individual, solo el usuario actual necesita completar sus ubicaciones
                    originLocation = ''; // Se completará cuando el usuario inicie el trayecto
                    destinationLocation = '';
                } else if (journeyType === 'common_destination') {
                    originLocation = ''; // Se completará cuando el usuario se una
                    destinationLocation = commonDestination.trim();
                } else { // personalized
                    const userLocation = participantLocations[participantId];
                    originLocation = userLocation?.origin || '';
                    destinationLocation = userLocation?.destination || '';
                }

                // 5. Crear ubicaciones de origen y destino
                let originLocationId: number | undefined;
                let destinationLocationId: number | undefined;

                if (originLocation) {
                    const originLoc: Location = {
                        id: 0,
                        latitude: 0, // Se actualizará cuando se obtenga la ubicación real
                        longitude: 0,
                        timestamp: new Date().toISOString()
                    };
                    await createLocation(originLoc);
                    // Note: En una implementación real, necesitarías obtener el ID retornado
                    // originLocationId = createdOriginId;
                }

                if (destinationLocation) {
                    const destLoc: Location = {
                        id: 0,
                        latitude: 0, // Se actualizará con geocoding del destino
                        longitude: 0,
                        timestamp: new Date().toISOString()
                    };
                    await createLocation(destLoc);
                    // destinationLocationId = createdDestId;
                }

                // 6. Crear participación
                const participationData: Partial<ParticipationDto> = {
                    journeyId: journeyId,
                    userId: participantId,
                    sharedLocation: false, // Inicialmente false, se activará cuando el usuario se una
                    participationState: participantId === currentUser?.id ? 'ACCEPTED' : 'PENDING',
                    sourceId: originLocationId || 0, // Se actualizará cuando se obtenga la ubicación
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

            Alert.alert(
                'Trayecto creado',
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

        if (journeyType === 'common_destination') {
            return (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Destino común</Text>
                    <Text style={styles.sectionSubtitle}>
                        Todos los participantes compartirán el mismo destino
                    </Text>
                    
                    <View style={styles.inputContainer}>
                        <Ionicons name="location" size={20} color="#7A33CC" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa el destino"
                            value={commonDestination}
                            onChangeText={setCommonDestination}
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>
                </View>
            );
        }

        if (journeyType === 'personalized') {
            return (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ubicaciones personalizadas</Text>
                    <Text style={styles.sectionSubtitle}>
                        Define origen y destino para cada participante
                    </Text>

                    {selectedParticipants.map(userId => {
                        const user = members.find(m => m.id === userId);
                        if (!user) return null;

                        const location = participantLocations[userId] || { origin: '', destination: '', userId, userName: user.name };

                        return (
                            <View key={userId} style={styles.locationCard}>
                                <Text style={styles.locationCardTitle}>{user.name}</Text>
                                
                                <View style={styles.inputContainer}>
                                    <Ionicons 
                                        name="radio-button-on" 
                                        size={20} 
                                        color="#10B981" 
                                        style={styles.inputIcon} 
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Origen"
                                        value={location.origin || ''}
                                        onChangeText={(text) => updateParticipantLocation(userId, 'origin', text)}
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Ionicons 
                                        name="location" 
                                        size={20} 
                                        color="#EF4444" 
                                        style={styles.inputIcon} 
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Destino"
                                        value={location.destination || ''}
                                        onChangeText={(text) => updateParticipantLocation(userId, 'destination', text)}
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            </View>
                        );
                    })}
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
                            (!journeyType || creating) && styles.createButtonDisabled
                        ]}
                        onPress={handleCreateJourney}
                        disabled={!journeyType || creating}
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
});