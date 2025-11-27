import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';

// Importar APIs y tipos
import { JourneyDto, JourneyStates } from '@/api/backend/journeys/journeyType';
import { isUserParticipantInJourney } from '@/api/backend/journeys/journeyApi';
import { Group, GROUP_TYPES } from '@/api/backend/group/groupType';
import { User, useUserStore } from "../../lib/storage/useUserStorage";
import { useUserGroups } from '@/lib/hooks/useUserGroups';

// Importar componentes
import BatteryDisplay, { ParticipantsList } from '@/components/common/BatteryDisplay';
import JoinJourneyModal from '@/components/chat/JoinJourneyModal';
import JourneyCollapsedTab from '@/components/journey/JourneyCollapsedTab';
import JourneySimpleInterface from '@/components/journey/JourneySimpleInterface';
import GroupOptionsSheet from '@/components/journey/GroupOptionsSheet';

// Importar hooks y utilidades
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { ParticipationDto } from '@/api/backend/participations/participationType';
import { listenJourneyState } from '@/api/firebase/journey/journeyService';
import { mapUserToDto } from '@/api/backend/user/mapper';

interface GroupWithJourney {
  group: Group;
  activeJourney: JourneyDto;
}

interface Props {
  groupJourney?: GroupWithJourney | null;
  onStartJourney: () => void;
  onCompleteJourney?: () => void;
}

const JourneyOverlay = React.memo(function JourneyOverlay({ groupJourney, onStartJourney, onCompleteJourney }: Props) {
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [showJourneyOptions, setShowJourneyOptions] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [showGroupTypeSelector, setShowGroupTypeSelector] = useState(false);
  const [selectedGroupType, setSelectedGroupType] = useState<'CONFIANZA' | 'TEMPORAL' | null>(null);
  const [showJoinJourneyModal, setShowJoinJourneyModal] = useState(false);
  const [isUserParticipant, setIsUserParticipant] = useState(false);
  const [checkingParticipation, setCheckingParticipation] = useState(true);
  const [journeyState, setJourneyState] = useState<string>(groupJourney?.activeJourney.state || 'PENDING');

  const {user} = useUserStore();
  
  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);
  const { groups: userGroups, loading: groupsLoading } = useUserGroups();

  // ✅ Verificar si el usuario es participante usando endpoint optimizado
  useEffect(() => {
    const checkIfUserIsParticipant = async () => {
      if (!groupJourney || !user) {
        setIsUserParticipant(false);
        setCheckingParticipation(false);
        return;
      }

      setCheckingParticipation(true);

      try {
        
        // Obtener token
        const token = await getToken();
        setToken(token);
        
        const isParticipant = await isUserParticipantInJourney(groupJourney.activeJourney.id);
        
        setIsUserParticipant(isParticipant);
        console.log(`Usuario ${isParticipant ? 'ES' : 'NO es'} participante`);
        
      } catch (error) {
        console.error('Error verificando participación:', error);
        setIsUserParticipant(false);
      } finally {
        setCheckingParticipation(false);
      }
    };

    checkIfUserIsParticipant();
  }, [groupJourney?.activeJourney.id, user?.id]);

  // Escuchar Firebase y recibir estado ya sincronizado desde Backend
  useEffect(() => {
    if (!groupJourney) {
      setJourneyState('PENDING');
      return;
    }

    const chatId = groupJourney.group.id.toString();
    const journeyId = groupJourney.activeJourney.id.toString();

    // Estado inicial del backend
    setJourneyState(groupJourney.activeJourney.state);

    console.log('👂 [JourneyOverlay] Escuchando cambios en Firebase para journey:', journeyId);

    // listenJourneyState ahora sincroniza automáticamente con el backend
    const unsubscribe = listenJourneyState(
      chatId,
      journeyId,
      (backendState, data) => {
        // backendState ya viene verificado y sincronizado desde journeyService.ts
        console.log('✅ [JourneyOverlay] Estado actualizado desde backend:', backendState);
        setJourneyState(backendState);
      },
      (error) => {
        console.error('❌ [JourneyOverlay] Error en listener:', error);
      }
    );

    return () => {
      console.log('🧹 [JourneyOverlay] Deteniendo listener');
      unsubscribe();
    };
  }, [groupJourney]);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [contentHeight, setContentHeight] = useState<number>(300);

  const snapPoints = useMemo(() => {
    const tabHeight = 150;
    
    let expandedHeight;
    let context;
    
    if (groupJourney) {
      expandedHeight = Math.max(contentHeight, 400);
      context = 'journey activo';
    } else if (showJourneyOptions) {
      expandedHeight = Math.max(contentHeight, 500);
      context = 'opciones de grupo';
    } else {
      expandedHeight = Math.max(contentHeight, 250);
      context = 'interfaz simple';
    }
    
    const points = [tabHeight, expandedHeight];
    console.log('📐 Snap Points calculados:', { context, contentHeight, points });
    
    return points;
  }, [groupJourney, showJourneyOptions, contentHeight]);

  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleSheetChanges = useCallback((index: number) => {
    console.log('Bottom sheet cambió a índice:', index);
    setIsCollapsed(index === 0);
  }, []);

  const handleContentLayout = useCallback((event: any) => {
    const { height } = event.nativeEvent.layout;
    const totalHeight = height + 100;
    setContentHeight(totalHeight);
  }, []);

  const expandSheet = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (groupJourney || (!loading && !groupsLoading)) {
        console.log('🔄 Auto-expandiendo BottomSheet:', { 
          hasGroupJourney: !!groupJourney, 
          loading, 
          groupsLoaded: !groupsLoading,
          userGroupsCount: userGroups.length 
        });
        expandSheet();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [groupJourney, loading, groupsLoading, userGroups.length, expandSheet]);

  const collapseToTab = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const handleCreateGroup = () => {
    if (userGroups.length === 0) {
      setShowGroupTypeSelector(true);
    } else {
      setSelectedGroupType('TEMPORAL');
      setShowCreateGroupModal(true);
    }
  };

  const handleCreateGroupWithType = (type: 'CONFIANZA' | 'TEMPORAL') => {
    setSelectedGroupType(type);
    setShowGroupTypeSelector(false);
    setShowCreateGroupModal(true);
  };

  const handleJoinGroup = () => {
    setShowJoinGroupModal(true);
  };

  const handleGroupSelected = (group: Group) => {
    console.log('🎯 Grupo seleccionado para iniciar journey:', group.name, 'ID:', group.id);
    
    // Navegar a la pantalla de creación de journey con el groupId
    router.push(`/chat/journey?groupId=${group.id}`);
    
    // Cerrar el bottom sheet de opciones
    setShowJourneyOptions(false);
  };

  const handleGroupCreated = () => {
    setShowCreateGroupModal(false);
    const { invalidateGroupsCache } = require('@/lib/hooks/useUserGroups');
    invalidateGroupsCache();
    onStartJourney();
  };

  // ✅ MEJORADO: Re-verificar participación después de unirse exitosamente
  const handleJoinSuccess = async (participation: ParticipationDto) => {
    console.log('✅ Usuario unido al trayecto:', participation);
    setShowJoinJourneyModal(false);
    
    // Actualizar inmediatamente
    setIsUserParticipant(true);
    
    // Re-verificar con backend después de un pequeño delay
    if (groupJourney) {
      setTimeout(async () => {
        try {
          const token = await getToken();
          setToken(token);
          const isParticipant = await isUserParticipantInJourney(groupJourney.activeJourney.id);
          console.log('🔄 Re-verificación: Usuario es participante:', isParticipant);
          setIsUserParticipant(isParticipant);
        } catch (err) {
          console.warn('⚠️ Error re-verificando participación:', err);
        }
      }, 500);
    }
  };

  const renderExpandedContent = () => {
    if (groupJourney) {
      return renderActiveJourneyFromGroupForSheet(groupJourney);
    } else if (showJourneyOptions) {
      return (
        <GroupOptionsSheet
          userGroups={userGroups}
          showCreateGroupModal={showCreateGroupModal}
          showJoinGroupModal={showJoinGroupModal}
          showGroupTypeSelector={showGroupTypeSelector}
          selectedGroupType={selectedGroupType}
          onClose={() => setShowJourneyOptions(false)}
          onGroupSelected={handleGroupSelected}
          onCreateGroup={handleCreateGroup}
          onJoinGroup={handleJoinGroup}
          onCreateGroupWithType={handleCreateGroupWithType}
          onGroupCreated={handleGroupCreated}
          setShowCreateGroupModal={setShowCreateGroupModal}
          setShowJoinGroupModal={setShowJoinGroupModal}
          setShowGroupTypeSelector={setShowGroupTypeSelector}
          setSelectedGroupType={setSelectedGroupType}
          onLayout={handleContentLayout}
        />
      );
    } else {
      return (
        <JourneySimpleInterface
          onStartJourney={() => setShowJourneyOptions(true)}
          onLayout={handleContentLayout}
        />
      );
    }
  };

  const renderActiveJourneyFromGroupForSheet = (selectedGroupJourney: GroupWithJourney) => {
    const canControlJourney = isUserParticipant;
    const currentState = journeyState || selectedGroupJourney.activeJourney.state;

    return (
      <BottomSheetView 
        style={styles.sheetContent}
        onLayout={handleContentLayout}
      >
        
        <View style={styles.sheetHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="navigate-circle" size={24} color="#4CAF50" />
            <Text style={styles.sheetTitle}>Trayecto Activo</Text>
          </View>
          <View style={styles.headerRight}>
            {/* Batería del usuario actual usando BatteryDisplay */}
            <View style={styles.currentUserBattery}>
              <BatteryDisplay
                showControls={false}
                autoRefresh={true}
                refreshInterval={60000} // 1 minuto
              />
            </View>
            <Pressable onPress={collapseToTab} style={styles.collapseButton}>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </Pressable>
          </View>
        </View>

        <Text style={styles.journeyName}>
          {selectedGroupJourney.group.name} - {selectedGroupJourney.activeJourney.journeyType || 'En curso'}
        </Text>

        <View style={styles.journeyInfo}>
          <Text style={styles.journeyStatus}>
            Estado: {currentState === 'IN_PROGRESS' ? 'En progreso' : currentState === 'COMPLETED' ? 'Completado' : 'Pendiente'}
          </Text>
          
          {/* NUEVO: Mostrar botón de unirse si NO es participante */}
          {!checkingParticipation && !canControlJourney && currentState !== 'COMPLETED' && (
            <View style={styles.notParticipantContainer}>
              <Text style={styles.notParticipantText}>
                📋 No estás participando en este trayecto
              </Text>
              <Pressable 
                style={styles.joinJourneyButton} 
                onPress={() => setShowJoinJourneyModal(true)}
              >
                <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.joinJourneyButtonText}>Unirme al Trayecto</Text>
              </Pressable>
            </View>
          )}

          {/* Solo mostrar controles si ES participante */}
          {canControlJourney && (
            <>
              {currentState === 'PENDING' && (
                <Pressable style={styles.startButton} onPress={onStartJourney}>
                  <Ionicons name="play" size={20} color="#fff" />
                  <Text style={styles.startButtonText}>Iniciar Trayecto</Text>
                </Pressable>
              )}
              
              {currentState === 'IN_PROGRESS' && (
                <View style={styles.actionButtonsContainer}>
                  <Text style={styles.inProgressText}>
                    🟢 Trayecto en curso • Ubicación compartida
                  </Text>
                </View>
              )}

              {currentState === 'COMPLETED' && (
                <Text style={styles.completedText}>
                  ✅ Trayecto completado
                </Text>
              )}
            </>
          )}
          
          {/* Mostrar indicador de carga mientras se verifica */}
          {checkingParticipation && (
            <Text style={styles.checkingText}>
              ⏳ Verificando participación...
            </Text>
          )}
        </View>

        {/* Lista de participantes usando el componente dedicado */}
        <BottomSheetScrollView 
          style={styles.participantsList} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.participantsListContent}
        >
          <ParticipantsList 
            journey={selectedGroupJourney.activeJourney}
            autoRefresh={true}
            refreshInterval={30000}
          />
        </BottomSheetScrollView>

        {/* Solo mostrar botón de finalizar si ES participante y está IN_PROGRESS */}
        {canControlJourney && currentState === 'IN_PROGRESS' && onCompleteJourney && (
          <View style={styles.sheetFooter}>
            <Pressable style={styles.endButton} onPress={onCompleteJourney}>
              <Ionicons name="stop-circle" size={20} color="#FFFFFF" />
              <Text style={styles.endButtonText}>Finalizar Trayecto</Text>
            </Pressable>
          </View>
        )}

        <JoinJourneyModal
          visible={showJoinJourneyModal}
          onClose={() => setShowJoinJourneyModal(false)}
          journey={selectedGroupJourney.activeJourney}
          currentUser={mapUserToDto(user)}
          onJoinSuccess={handleJoinSuccess}
          chatId={selectedGroupJourney.group.id.toString()}
        />
      </BottomSheetView>
    );
  };

  if (loading) {
    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={[80, 200]}
        onChange={handleSheetChanges}
        enablePanDownToClose={false}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.bottomSheetBackground}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </BottomSheetView>
      </BottomSheet>
    );
  }

  const renderSheetContent = () => {
    if (isCollapsed) {
      return <JourneyCollapsedTab groupJourney={groupJourney} onExpand={expandSheet} />;
    }
    return renderExpandedContent();
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0} // Empezar colapsado
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={false} // No permitir cerrar completamente
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.bottomSheetBackground}
    >
      {renderSheetContent()}
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  journeyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7A33CC',
    marginBottom: 16,
    textAlign: 'center',
  },
  participantsList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  endButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  endButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
  },
  journeyInfo: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  journeyStatus: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  handleIndicator: {
    backgroundColor: '#D1D5DB',
    width: 40,
  },
  bottomSheetBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  currentUserBattery: {
    transform: [{ scale: 0.8 }],
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  collapseButton: {
    padding: 4,
  },
  sheetFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 'auto',
  },
  collapsedContainer: {
    flex: 1,
  },
  collapsedContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  collapsedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collapsedIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  collapsedTextContainer: {
    flex: 1,
  },
  collapsedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  collapsedSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  participantsListContent: {
    paddingBottom: 16,
  },
  actionButtonsContainer: {
    marginTop: 8,
  },
  inProgressText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 8,
  },
  notParticipantContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },

  notParticipantText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    marginBottom: 12,
  },
  joinJourneyButton: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  joinJourneyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  checkingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 8,
    fontStyle: 'italic',
  },
  completedText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 8,
  },
});

export default JourneyOverlay;
