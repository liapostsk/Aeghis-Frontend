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
import { createJourney, updateJourney } from '@/api/journeys/journeyApi';
import { createParticipation } from '@/api/participations/participationApi';
import { createLocation } from '@/api/locations/locationsApi';
import { sendMessageFirebase } from '@/api/firebase/chat/chatService';
import { createJourneyInChat } from '@/api/firebase/journey/journeyService';
import { joinJourneyParticipation } from '@/api/firebase/journey/participationsService';
import { addUserPosition } from '@/api/firebase/journey/positionsService';
import { auth } from '@/firebaseconfig';
import * as ExpoLocation from 'expo-location';
import SafeLocationModal from '@/components/safeLocations/SafeLocationModal';
import {
    DestinationSelector,
    JourneyTypeSelector,
    ParticipantSelector,
    GroupBanner,
    JourneyNameInput,
    CreateJourneyButton,
    JourneyType,
    validateJourneyForm,
    generateDefaultJourneyName,
} from '@/components/journey';

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

                // Generar nombre por defecto usando utilidad
                setJourneyName(generateDefaultJourneyName());

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
    const sendJourneyRequestMessage = async (journeyId: number, journeyName: string, targetParticipants: number[]) => {
        try {
            if (!group?.id) return;

            const targetNames = members
                .filter(m => targetParticipants.includes(m.id))
                .map(m => m.name)
                .join(', ');

            const destinationText = selectedDestination ? selectedDestination.name : 'Por definir';

            const message = `${currentUser?.name || 'Usuario'} ha creado un nuevo trayecto grupal: "${journeyName}"
📍 Destino: ${destinationText}

ID del trayecto: ${journeyId}`;

            await sendMessageFirebase(group.id.toString(), message);
        } catch (error) {
            console.error('Error sending journey request message:', error);
            throw error; // Re-throw para que el caller pueda manejar el error
        }
    };

    // Manejadores de selección de destino
    const handleSelectDestination = (location: SafeLocation | Location) => {
        // Convertir Location a SafeLocation si es necesario
        const safeLocation: SafeLocation = 'name' in location ? location : {
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

    // Validación del formulario usando utilidad
    const validateForm = (): boolean => {
        const formData = {
            journeyType,
            journeyName,
            selectedParticipants,
            selectedDestination
        };

        const validation = validateJourneyForm(formData);
        
        if (!validation.isValid) {
            const firstError = validation.errors[0];
            Alert.alert('Error', firstError.message);
            return false;
        }

        return true;
    };

    // Crear trayecto
    const handleCreateJourney = async () => {
        if (!validateForm()) return;

        try {
            setCreating(true);

            // 1. ESTRATEGIA SECUENCIAL: Crear Journey primero (sin participantsIds)
            setCreationStep('Creando trayecto...');
            const journeyData: Partial<JourneyDto> = {
                groupId: Number(groupId),
                journeyType: journeyType === 'individual' ? JourneyTypes.INDIVIDUAL : 
                      journeyType === 'common_destination' ? JourneyTypes.COMMON_DESTINATION : JourneyTypes.PERSONALIZED,
                state: journeyType === 'individual' ? JourneyStates.IN_PROGRESS : JourneyStates.PENDING,
                iniDate: new Date().toISOString(),
                participantsIds: [] // Empieza vacío, se llena cuando se unen miembros
            };

            console.log('📝 Creando journey:', journeyData);
            const token = await getToken();
            setToken(token);

            // Crear journey en el backend
            const journeyId = await createJourney(journeyData as JourneyDto);
            console.log('Journey creado con ID:', journeyId);

            // Crear journey en Firebase para tiempo real
            setCreationStep('Configurando journey en tiempo real...');
            const chatId = group?.id?.toString();
            if (chatId) {
                await createJourneyInChat(chatId, { ...journeyData, id: journeyId } as JourneyDto);
                console.log('Journey creado en Firebase:', chatId, journeyId);
            }

            // 2. Añadir automáticamente al CREADOR como participante
            setCreationStep('Añadiéndote como participante...');
            
            // Obtener ubicación actual del creador
            const deviceLocation = await getCurrentLocation();
            if (!deviceLocation) {
                throw new Error('No se pudo obtener tu ubicación actual');
            }

            // Crear ubicación de origen del creador
            const originLocationId = await createLocationRecord(deviceLocation);
            if (!originLocationId) {
                throw new Error('No se pudo registrar tu ubicación');
            }

            // Crear ubicación de destino (solo si está seleccionada)
            let destinationLocationId: number | undefined;
            if (selectedDestination) {
                const destLocation: Partial<Location> = {
                    latitude: selectedDestination.latitude,
                    longitude: selectedDestination.longitude,
                    timestamp: new Date().toISOString()
                };
                destinationLocationId = await createLocation(destLocation as Location);
            }

            // Crear participación del creador
            const creatorParticipationData: Partial<ParticipationDto> = {
                journeyId: journeyId, // Ahora ya tenemos el journeyId
                userId: currentUser?.id || 0,
                sharedLocation: true, // El creador siempre comparte ubicación
                state: 'ACCEPTED', // El creador siempre está aceptado
                sourceId: originLocationId,
                destinationId: destinationLocationId || originLocationId // Si no hay destino específico, usar origen
            };
            
            // Crear participación en backend
            const creatorParticipationId = await createParticipation(creatorParticipationData as ParticipationDto);
            console.log('Creador añadido como participante con ID:', creatorParticipationId);

            // Crear participación en Firebase para tiempo real
            if (chatId) {
                const destinationPosition = selectedDestination ? {
                    latitude: selectedDestination.latitude,
                    longitude: selectedDestination.longitude,
                    timestamp: new Date()
                } : undefined;

                await joinJourneyParticipation(chatId, journeyId.toString(), {
                    destination: destinationPosition,
                    backendParticipationId: creatorParticipationId,
                    initialState: 'ACCEPTED'
                });
                console.log('Participación creada en Firebase');

                // Añadir posición inicial del creador (usar Clerk UID)
                if (deviceLocation) {
                    // El servicio de Firebase usa el UID de Clerk automáticamente
                    await addUserPosition(
                        chatId, 
                        journeyId.toString(), 
                        auth.currentUser?.uid || '', 
                        deviceLocation.coords.latitude, 
                        deviceLocation.coords.longitude
                    );
                    console.log('Posición inicial añadida');
                }
            }

            // 3. Actualizar journey con ID de participación del creador
            setCreationStep('Actualizando trayecto...');
            const updatedJourneyData = {
                ...journeyData,
                id: journeyId,
                participantsIds: [creatorParticipationId] // Almacenar ID de participación del creador
            };
            
            await updateJourney(updatedJourneyData as JourneyDto);
            console.log('Journey actualizado con participación del creador');

            // 4. Manejar según tipo de trayecto
            if (journeyType === 'individual') {
                // Para individual: ya está listo, solo participa el creador
                Alert.alert(
                    '¡Trayecto individual creado!',
                    `El trayecto "${journeyName}" está listo. Puedes iniciarlo cuando quieras desde la vista del mapa.`,
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            } else {
                // Para grupal: enviar solicitud al chat para que otros se unan
                setCreationStep('Enviando solicitud al grupo...');
                
                try {
                    // Mensaje especial para solicitudes de journey con journeyId
                    const targetParticipants = selectedParticipants.filter(id => id !== currentUser?.id);
                    await sendJourneyRequestMessage(journeyId, journeyName, targetParticipants);

                    const participantNames = members
                        .filter(m => targetParticipants.includes(m.id))
                        .map(m => m.name)
                        .join(', ');

                    Alert.alert(
                        '¡Solicitud de trayecto enviada!',
                        `Se ha enviado una solicitud para el trayecto "${journeyName}" a ${participantNames}. ` +
                        'Podrán unirse desde el chat del grupo seleccionando su destino.',
                        [{ text: 'OK', onPress: () => router.back() }]
                    );
                } catch (chatError) {
                    console.warn('Error enviando mensaje al chat:', chatError);
                    Alert.alert(
                        'Trayecto creado',
                        `El trayecto "${journeyName}" se ha creado correctamente, pero no se pudo notificar al grupo. ` +
                        'Puedes compartir manualmente la información del trayecto.',
                        [{ text: 'OK', onPress: () => router.back() }]
                    );
                }
            }

        } catch (error) {
            console.error('❌ Error creating journey:', error);
            Alert.alert(
                'Error', 
                'No se pudo crear el trayecto. Verifica tu conexión e inténtalo de nuevo.'
            );
        } finally {
            setCreating(false);
            setCreationStep('');
        }
    };

    // Los componentes render se han movido a componentes modulares

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
                    <GroupBanner group={group} members={members} />

                    {/* Nombre del trayecto */}
                    <JourneyNameInput 
                        value={journeyName}
                        onChangeText={setJourneyName}
                        placeholder="Ej: Trayecto al trabajo"
                    />

                    {/* Tipo de trayecto */}
                    <JourneyTypeSelector 
                        selectedType={journeyType}
                        onSelectType={handleSelectJourneyType}
                    />

                    {/* Selector de participantes */}
                    <ParticipantSelector
                        journeyType={journeyType}
                        members={members}
                        currentUser={currentUser}
                        selectedParticipants={selectedParticipants}
                        onToggleParticipant={toggleParticipant}
                    />

                    {/* Selector de destino */}
                    {journeyType && journeyType !== 'individual' && (
                        <DestinationSelector
                            selectedDestination={selectedDestination}
                            onPress={() => setShowDestinationModal(true)}
                            isRequired={true}
                        />
                    )}

                    {/* Espacio para el botón */}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Botón de crear */}
                <CreateJourneyButton
                    onPress={handleCreateJourney}
                    disabled={!journeyType || creating || (journeyType !== 'individual' && !selectedDestination)}
                    loading={creating}
                    creationStep={creationStep}
                />
            </View>

            {/* Modal de selección de destino */}
            <SafeLocationModal
                visible={showDestinationModal}
                onClose={handleCloseDestinationModal}
                onSelectLocation={handleSelectDestination}
                title="Seleccionar destino del trayecto"
                acceptLocationTypes="all"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    // Layout principal
    container: { 
        flex: 1, 
        backgroundColor: '#7A33CC' 
    },
    topArea: { 
        backgroundColor: '#7A33CC' 
    },
    body: { 
        flex: 1, 
        backgroundColor: '#F9FAFB' 
    },
    
    // Estados de carga
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    loadingText: { 
        color: '#6B7280', 
        marginTop: 12, 
        fontSize: 14 
    },
    
    // Header
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: { 
        marginRight: 12 
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '600',
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120, // Espacio para el botón flotante
    },
});