import React from 'react';
import { View, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import SafeLocationModal from '@/components/safeLocations/SafeLocationModal';
import {
    DestinationSelector,
    JourneyTypeSelector,
    ParticipantSelector,
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
    const { groupId } = useLocalSearchParams<{ groupId: string }>();
    const { getToken } = useAuth();
    const setToken = useTokenStore((state) => state.setToken);

    const { group, members, currentUser, loading } = useGroupData({
        groupId,
        getToken,
        setToken,
    });

    const {
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
    } = useJourneyForm({ currentUser });

    const {
        creating,
        creationStep,
        createJourneyFlow,
    } = useJourneyCreation({
        groupId,
        group,
        currentUser,
        members,
        getToken,
        setToken,
    });

    const handleCreateJourney = () => {
        if (!journeyType) return;
        createJourneyFlow(journeyType, journeyName, selectedParticipants, selectedDestination);
    };

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

                    <ParticipantSelector
                        journeyType={journeyType}
                        members={members}
                        currentUser={currentUser}
                        selectedParticipants={selectedParticipants}
                        onToggleParticipant={toggleParticipant}
                    />

                    {journeyType && journeyType !== 'individual' && (
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
                    disabled={!journeyType || creating || (journeyType !== 'individual' && !selectedDestination)}
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
