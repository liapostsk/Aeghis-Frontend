import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, Alert, Text, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useTranslation } from 'react-i18next';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { Ionicons } from '@expo/vector-icons';
import { getUserGroupsByType } from '@/api/backend/group/groupApi';
import SafeLocationModal from '@/components/safeLocations/SafeLocationModal';
import {
    DestinationSelector,
    JourneyTypeSelector,
    GroupBanner,
    JourneyNameInput,
    CreateJourneyButton,
    JourneyCreationHeader,
    LoadingJourneyScreen,
    useJourneyCreation,
    useJourneyForm,
    useGroupData,
} from '@/components/journey';

export default function journey() {
    const { t } = useTranslation();
    const params = useLocalSearchParams<{ groupId: string }>();
    const { getToken } = useAuth();
    const setToken = useTokenStore((state) => state.setToken);
    
    // Estados para validación de grupos COMPANION
    const [availableGroups, setAvailableGroups] = useState<any[]>([]);
    const [showGroupSelector, setShowGroupSelector] = useState(false);
    const [selectedTargetGroup, setSelectedTargetGroup] = useState<any>(null);

    // Validar groupId antes de usarlo
    const groupId = params.groupId;

    useEffect(() => {
        if (!groupId || groupId === 'undefined' || groupId === 'null') {
            console.error('[Journey Screen] GroupId inválido:', groupId);
            Alert.alert(
                t('journey.invalidGroup.title'),
                t('journey.invalidGroup.message'),
                [
                    {
                        text: t('journey.invalidGroup.back'),
                        onPress: () => router.back()
                    }
                ]
            );
        } else {
            console.log('[Journey Screen] GroupId válido:', groupId);
        }
    }, [groupId]);

    const { group, members, currentUser, loading } = useGroupData({
        groupId: groupId || '',
        getToken,
        setToken,
    });

    const {
        journeyType,
        journeyName,
        selectedDestination,
        showDestinationModal,
        setJourneyName,
        setShowDestinationModal,
        handleSelectJourneyType,
        handleSelectDestination,
    } = useJourneyForm({ currentUser });

    const {
        creating,
        creationStep,
        createJourneyFlow,
    } = useJourneyCreation({
        groupId: groupId || '',
        group,
        currentUser,
        members,
        getToken,
        setToken,
    });

    // Cargar grupos disponibles para compartir ubicación
    useEffect(() => {
        if (group?.type === 'COMPANION') {
            loadAvailableGroups();
        }
    }, [group]);

    // Establecer journeyType automáticamente para grupos COMPANION
    useEffect(() => {
        if (group?.type === 'COMPANION' && !journeyType) {
            handleSelectJourneyType('individual');
        }
    }, [group, journeyType, handleSelectJourneyType]);

    // Validar que selectedTargetGroup siga existiendo cuando cambian availableGroups
    useEffect(() => {
        if (selectedTargetGroup && availableGroups.length > 0) {
            const stillExists = availableGroups.find(g => g.id === selectedTargetGroup.id);
            if (!stillExists) {
                console.log('[Journey] Grupo seleccionado ya no está disponible, reseteando selección');
                setSelectedTargetGroup(null);
            }
        }
    }, [availableGroups, selectedTargetGroup]);

    const loadAvailableGroups = async () => {
        try {
            const token = await getToken();
            setToken(token);

            // Obtener grupos de confianza y temporales
            const [trustGroups, tempGroups] = await Promise.all([
                getUserGroupsByType('CONFIANZA'),
                getUserGroupsByType('TEMPORAL')
            ]);

            const combined = [...trustGroups, ...tempGroups];
            setAvailableGroups(combined);
            console.log('Grupos disponibles para compartir ubicación:', combined.length);
        } catch (error) {
            console.error('Error cargando grupos:', error);
            setAvailableGroups([]);
        }
    };

    // Validación antes de crear journey
    const handleCreateJourney = () => {
        if (!journeyType || !selectedDestination) return;

        // Si es grupo COMPANION, validar que tenga grupos donde compartir
        if (group?.type === 'COMPANION') {
            if (availableGroups.length === 0) {
                Alert.alert(
                    t('journey.companion.groupsRequired.title'),
                    t('journey.companion.groupsRequired.message'),
                    [
                        {
                            text: t('journey.companion.groupsRequired.createGroup'),
                            onPress: () => router.push('/groups')
                        },
                        { text: t('journey.companion.groupsRequired.cancel'), style: 'cancel' }
                    ]
                );
                return;
            }

            // Mostrar selector de grupo objetivo
            setSelectedTargetGroup(null); // Resetear selección anterior
            setShowGroupSelector(true);
            return;
        }

        // Para grupos normales, crear directamente
        if (journeyType) {
            createJourneyFlow(journeyType, journeyName, [], selectedDestination);
        } else {
            Alert.alert(t('journey.invalidGroup.title'), t('journey.errors.noType'));
        }
    };

    // Crear journey individual con grupo objetivo
    const handleCreateIndividualJourney = () => {
        if (!selectedTargetGroup) {
            Alert.alert(t('journey.invalidGroup.title'), t('journey.errors.noGroup'));
            return;
        }

        Alert.alert(
            t('journey.companion.confirmCreate.title'),
            t('journey.companion.confirmCreate.message', { groupName: selectedTargetGroup.name }),
            [
                {
                    text: t('journey.companion.confirmCreate.confirm'),
                    onPress: () => {
                        // Usar el groupId del grupo objetivo y pasar el groupId COMPANION para notificación
                        createJourneyFlow('individual', journeyName, [], selectedDestination, selectedTargetGroup.id.toString(), groupId);
                        setShowGroupSelector(false);
                    }
                },
                { text: t('journey.companion.confirmCreate.cancel'), style: 'cancel' }
            ]
        );
    };

    // Cerrar modal y resetear selección
    const closeGroupSelector = () => {
        setShowGroupSelector(false);
        setSelectedTargetGroup(null);
    };

    // Si no hay groupId válido, mostrar loading mientras se redirige
    if (!groupId || groupId === 'undefined' || groupId === 'null') {
        return <LoadingJourneyScreen />;
    }

    if (loading) {
        return <LoadingJourneyScreen />;
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#7A33CC" />
            
            <SafeAreaView style={styles.topArea}>
                <JourneyCreationHeader onBack={() => router.back()} />
            </SafeAreaView>

            <View style={styles.body}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <GroupBanner group={group} members={members} />

                    {/* Aviso para grupos COMPANION */}
                    {group?.type === 'COMPANION' && (
                        <View style={styles.companionInfo}>
                            <Ionicons name="information-circle" size={20} color="#7A33CC" />
                            <Text style={styles.companionInfoText}>
                                {t('journey.companion.info')}
                            </Text>
                        </View>
                    )}

                    <JourneyNameInput 
                        value={journeyName}
                        onChangeText={setJourneyName}
                        placeholder={
                            group?.type === 'COMPANION' 
                                ? t('journey.companion.namePlaceholder') 
                                : t('journey.namePlaceholder')
                        }
                    />

                    {/* Solo trayecto individual para COMPANION */}
                    {group?.type === 'COMPANION' ? (
                        <View style={styles.journeyTypeFixed}>
                            <Text style={styles.journeyTypeLabel}>{t('journey.companion.typeLabel')}</Text>
                            <View style={styles.journeyTypeCard}>
                                <Ionicons name="person-outline" size={24} color="#7A33CC" />
                                <Text style={styles.journeyTypeText}>{t('journey.companion.typeIndividual')}</Text>
                            </View>
                        </View>
                    ) : (
                        <JourneyTypeSelector 
                            selectedType={journeyType}
                            onSelectType={handleSelectJourneyType}
                        />
                    )}

                    {(journeyType || group?.type === 'COMPANION') && (
                        <DestinationSelector
                            selectedDestination={selectedDestination}
                            onPress={() => setShowDestinationModal(true)}
                            isRequired={true}
                        />
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>

                <CreateJourneyButton
                    onPress={handleCreateJourney}
                    disabled={
                        !selectedDestination || 
                        creating || 
                        (!journeyType && group?.type !== 'COMPANION')
                    }
                    loading={creating}
                    creationStep={creationStep}
                />
            </View>

            {/* Modal selector de grupo objetivo */}
            {showGroupSelector && (
                <View style={styles.modalOverlay}>
                    <View style={styles.groupSelectorModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('journey.companion.selector.title')}</Text>
                            <Pressable onPress={closeGroupSelector}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </Pressable>
                        </View>

                        <ScrollView style={styles.groupsList}>
                            {availableGroups.map((targetGroup) => (
                                <Pressable
                                    key={targetGroup.id}
                                    style={[
                                        styles.groupOption,
                                        selectedTargetGroup?.id === targetGroup.id && styles.groupOptionSelected
                                    ]}
                                    onPress={() => setSelectedTargetGroup(targetGroup)}
                                >
                                    <Ionicons 
                                        name={targetGroup.type === 'CONFIANZA' ? 'shield-checkmark' : 'time'} 
                                        size={20} 
                                        color="#7A33CC" 
                                    />
                                    <View style={styles.groupOptionContent}>
                                        <Text style={styles.groupOptionName}>{targetGroup.name}</Text>
                                        <Text style={styles.groupOptionType}>
                                            {targetGroup.type === 'CONFIANZA' ? t('journey.companion.selector.trustType') : t('journey.companion.selector.temporalType')}
                                        </Text>
                                    </View>
                                </Pressable>
                            ))}
                        </ScrollView>

                        <Pressable
                            style={[
                                styles.confirmButton,
                                !selectedTargetGroup && styles.confirmButtonDisabled
                            ]}
                            onPress={handleCreateIndividualJourney}
                            disabled={!selectedTargetGroup}
                        >
                            <Text style={styles.confirmButtonText}>{t('journey.companion.selector.confirm')}</Text>
                        </Pressable>
                    </View>
                </View>
            )}

            <SafeLocationModal
                visible={showDestinationModal}
                onClose={() => setShowDestinationModal(false)}
                onSelectLocation={handleSelectDestination}
                title="Seleccionar destino del trayecto"
                acceptLocationTypes="all"
            />
        </View>
    );
}


const styles = StyleSheet.create({
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
    scrollContent: {
        paddingBottom: 120,
    },
    companionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F8FF',
        margin: 16,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#B3D9FF',
    },
    companionInfoText: {
        flex: 1,
        fontSize: 13,
        color: '#1E40AF',
        marginLeft: 8,
    },
    
    journeyTypeFixed: {
        margin: 16,
    },
    journeyTypeLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    journeyTypeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3E8FF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E9D5FF',
    },
    journeyTypeText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#7A33CC',
        marginLeft: 12,
    },
    
    // Estilos del modal selector
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    groupSelectorModal: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        margin: 20,
        maxHeight: '60%',
        width: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    groupsList: {
        maxHeight: 300,
    },
    groupOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    groupOptionSelected: {
        backgroundColor: '#F3E8FF',
    },
    groupOptionContent: {
        flex: 1,
        marginLeft: 12,
    },
    groupOptionName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1F2937',
    },
    groupOptionType: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    confirmButton: {
        backgroundColor: '#7A33CC',
        margin: 16,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: '#D1D5DB',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
