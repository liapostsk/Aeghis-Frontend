import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
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
    const params = useLocalSearchParams<{ groupId: string }>();
    const { getToken } = useAuth();
    const setToken = useTokenStore((state) => state.setToken);

    // Validar groupId antes de usarlo
    const groupId = params.groupId;

    useEffect(() => {
        if (!groupId || groupId === 'undefined' || groupId === 'null') {
            console.error('❌ [Journey Screen] GroupId inválido:', groupId);
            Alert.alert(
                'Error',
                'No se especificó un grupo válido',
                [
                    {
                        text: 'Volver',
                        onPress: () => router.back()
                    }
                ]
            );
        } else {
            console.log('✅ [Journey Screen] GroupId válido:', groupId);
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

    const handleCreateJourney = () => {
        if (!journeyType) return;
        // Ya no pasamos selectedParticipants (array vacío)
        createJourneyFlow(journeyType, journeyName, [], selectedDestination);
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

                    <JourneyNameInput 
                        value={journeyName}
                        onChangeText={setJourneyName}
                        placeholder="Ej: Trayecto al trabajo"
                    />

                    <JourneyTypeSelector 
                        selectedType={journeyType}
                        onSelectType={handleSelectJourneyType}
                    />

                    {journeyType && (
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
                    disabled={!journeyType || !selectedDestination || creating}
                    loading={creating}
                    creationStep={creationStep}
                />
            </View>

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
});
