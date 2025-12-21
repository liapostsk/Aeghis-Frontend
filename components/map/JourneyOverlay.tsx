import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

// Importar APIs y tipos
import { JourneyDto } from '@/api/backend/journeys/journeyType';
import { isUserParticipantInJourney } from '@/api/backend/journeys/journeyApi';
import { Group } from '@/api/backend/group/groupType';
import { User, useUserStore } from "../../lib/storage/useUserStorage";
import { useUserGroups } from '@/lib/hooks/useUserGroups';

// Importar componentes
import BatteryDisplay, { ParticipantsList } from '@/components/common/BatteryDisplay';
import JoinJourneyModal from '@/components/chat/JoinJourneyModal';
import JourneyCollapsedTab from '@/components/journey/JourneyCollapsedTab';
import JourneySimpleInterface from '@/components/journey/JourneySimpleInterface';

// Importar hooks y utilidades
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { ParticipationDto } from '@/api/backend/participations/participationType';
import { listenJourneyState } from '@/api/firebase/journey/journeyService';
import { mapUserToDto } from '@/api/backend/user/mapper';
import { usePositionTracking } from '@/lib/hooks/usePositions';
import GroupOptionsSheet from '../journey/GroupOptionsSheet';

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
  const { t } = useTranslation();
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
  const [isModalVisible, setIsModalVisible] = useState(false);

  const {user} = useUserStore();
  
  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);
  const { groups: userGroups, loading: groupsLoading } = useUserGroups();

  // Enviar posición a Firebase solo si el usuario es participante y el journey está IN_PROGRESS
  // (Evita bucles: los valores usados en el hook son estables y no cambian en cada render)
  const chatId = groupJourney?.group.id?.toString();
  const journeyId = groupJourney?.activeJourney?.id?.toString();
  const userId = user?.id?.toString();
  const enabled = !!chatId && !!journeyId && !!userId && isUserParticipant && journeyState === 'IN_PROGRESS';

  // Importa el hook correctamente
  // con esto se estamos guardando la posicion del usuario en firebase en cada minuto
  usePositionTracking(chatId || '', journeyId || '', userId || '', { enabled, intervalMs: 60000 });

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
        
        if (!groupJourney.activeJourney.id) return;
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

  useEffect(() => {
    if (!groupJourney) {
      setJourneyState('PENDING');
      return;
    }

    if (!groupJourney.group.id || !groupJourney.activeJourney.id) {
      return;
    }

    const chatId = groupJourney.group.id.toString();
    const journeyId = groupJourney.activeJourney.id.toString();

    // Estado inicial del backend
    setJourneyState(groupJourney.activeJourney.state);

    console.log('[JourneyOverlay] Escuchando cambios en Firebase para journey:', journeyId);

    // listenJourneyState ahora sincroniza automáticamente con el backend
    const unsubscribe = listenJourneyState(
      chatId,
      journeyId,
      (backendState, data) => {
        // backendState ya viene verificado y sincronizado desde journeyService.ts
        console.log('[JourneyOverlay] Estado actualizado desde backend:', backendState);
        setJourneyState(backendState);
      },
      (error) => {
        console.error('[JourneyOverlay] Error en listener:', error);
      }
    );

    return () => {
      console.log('🧹 [JourneyOverlay] Deteniendo listener');
      unsubscribe();
    };
  }, [groupJourney]);

  // No abrir automáticamente el modal, solo mostrar el tab colapsado
  // El usuario lo expandirá manualmente cuando lo necesite

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

  const handleJoinSuccess = async (participation: ParticipationDto) => {
    console.log('Usuario unido al trayecto:', participation);
    setShowJoinJourneyModal(false);
    
    // Actualizar inmediatamente
    setIsUserParticipant(true);
    
    // Re-verificar con backend después de un pequeño delay
    if (groupJourney && groupJourney.activeJourney.id) {
      setTimeout(async () => {
        try {
          const token = await getToken();
          setToken(token);
          const isParticipant = await isUserParticipantInJourney(groupJourney.activeJourney.id!);
          console.log('Re-verificación: Usuario es participante:', isParticipant);
          setIsUserParticipant(isParticipant);
        } catch (err) {
          console.warn('Error re-verificando participación:', err);
        }
      }, 500);
    }
  };

  const renderModalContent = () => {
    if (groupJourney && ['IN_PROGRESS', 'PENDING'].includes(journeyState)) {
      // Si hay journey activo o pendiente, mostrar la info del trayecto
      return renderActiveJourneyContent(groupJourney);
    } else if (showJourneyOptions) {
      // Si se han pedido opciones, mostrar el selector de grupo y creación
      return (
        <GroupOptionsSheet
          userGroups={userGroups || []}
          showCreateGroupModal={showCreateGroupModal}
          showJoinGroupModal={showJoinGroupModal}
          showGroupTypeSelector={showGroupTypeSelector}
          selectedGroupType={selectedGroupType}
          onClose={() => {
            setShowJourneyOptions(false);
          }}
          onGroupSelected={handleGroupSelected}
          onCreateGroup={handleCreateGroup}
          onJoinGroup={handleJoinGroup}
          onCreateGroupWithType={handleCreateGroupWithType}
          onGroupCreated={handleGroupCreated}
          setShowCreateGroupModal={setShowCreateGroupModal}
          setShowJoinGroupModal={setShowJoinGroupModal}
          setShowGroupTypeSelector={setShowGroupTypeSelector}
          setSelectedGroupType={setSelectedGroupType}
        />
      );
    } else {
      // Mostrar interfaz simple por defecto
      return (
        <JourneySimpleInterface
          onStartJourney={() => setShowJourneyOptions(true)}
        />
      );
    }
  };

  const renderActiveJourneyContent = (selectedGroupJourney: GroupWithJourney) => {
    const canControlJourney = isUserParticipant;
    const currentState = journeyState || selectedGroupJourney.activeJourney.state;

    return (
      <View style={styles.modalContent}>
        <View style={styles.sheetHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="navigate-circle" size={24} color="#4CAF50" />
            <Text style={styles.sheetTitle}>{t('overlay.activeJourney')}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.currentUserBattery}>
              <BatteryDisplay
                showControls={false}
                autoRefresh={true}
                refreshInterval={60000}
              />
            </View>
            <Pressable onPress={() => setIsModalVisible(false)} style={styles.collapseButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>
        </View>

        <Text style={styles.journeyName}>
          {selectedGroupJourney.group.name} - {selectedGroupJourney.activeJourney.journeyType || 'En curso'}
        </Text>

        <View style={styles.journeyInfo}>
          <Text style={styles.journeyStatus}>
            {t('overlay.status')}: {currentState === 'IN_PROGRESS' ? t('overlay.inProgress') : currentState === 'COMPLETED' ? t('overlay.completed') : t('overlay.pending')}
          </Text>
          
          {/* Mostrar botón de unirse solo si NO es individual */}
          {!checkingParticipation && !canControlJourney && currentState !== 'COMPLETED' && selectedGroupJourney.activeJourney.journeyType !== 'INDIVIDUAL' && (
            <View style={styles.notParticipantContainer}>
              <Text style={styles.notParticipantText}>
                {t('overlay.notParticipating')}
              </Text>
              <Pressable 
                style={styles.joinJourneyButton} 
                onPress={() => setShowJoinJourneyModal(true)}
              >
                <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.joinJourneyButtonText}>{t('overlay.joinJourney')}</Text>
              </Pressable>
            </View>
          )}

          {/* Solo mostrar controles si ES participante */}
          {canControlJourney && (
            <>
              {currentState === 'PENDING' && (
                <Pressable style={styles.startButton} onPress={onStartJourney}>
                  <Ionicons name="play" size={20} color="#fff" />
                  <Text style={styles.startButtonText}>{t('overlay.startJourney')}</Text>
                </Pressable>
              )}
              
              {currentState === 'IN_PROGRESS' && (
                <View style={styles.actionButtonsContainer}>
                  <Text style={styles.inProgressText}>
                    {t('overlay.journeyInProgress')}
                  </Text>
                </View>
              )}

              {currentState === 'COMPLETED' && (
                <Text style={styles.completedText}>
                  {t('overlay.journeyCompleted')}
                </Text>
              )}
            </>
          )}
          
          {/* Mostrar indicador de carga mientras se verifica */}
          {checkingParticipation && (
            <Text style={styles.checkingText}>
              {t('overlay.checkingParticipation')}
            </Text>
          )}
        </View>

        {/* Lista de participantes usando el componente dedicado */}
        <ScrollView 
          style={styles.participantsList} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.participantsListContent}
        >
          <ParticipantsList 
            journey={selectedGroupJourney.activeJourney}
            autoRefresh={true}
            refreshInterval={30000}
          />
        </ScrollView>

        {/* Solo mostrar botón de finalizar si ES participante y está IN_PROGRESS */}
        {canControlJourney && currentState === 'IN_PROGRESS' && onCompleteJourney && (
          <View style={styles.sheetFooter}>
            <Pressable style={styles.endButton} onPress={onCompleteJourney}>
              <Ionicons name="stop-circle" size={20} color="#FFFFFF" />
              <Text style={styles.endButtonText}>{t('overlay.finishJourney')}</Text>
            </Pressable>
          </View>
        )}

        <JoinJourneyModal
          visible={showJoinJourneyModal}
          onClose={() => setShowJoinJourneyModal(false)}
          journey={selectedGroupJourney.activeJourney}
          currentUser={user ? mapUserToDto(user) : null}
          onJoinSuccess={handleJoinSuccess}
          chatId={selectedGroupJourney.group.id ? selectedGroupJourney.group.id.toString() : ""}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.overlayContainer}>
        <View style={styles.panelContainer}>
          <Text style={styles.loadingText}>{t('overlay.loading')}</Text>
        </View>
      </View>
    );
  }

  // Si hay journey activo y el modal está cerrado, mostrar tab colapsado
  if (groupJourney && !isModalVisible) {
    return (
      <JourneyCollapsedTab 
        groupJourney={groupJourney} 
        onExpand={() => setIsModalVisible(true)} 
      />
    );
  }

  // Si hay journey activo y el modal está abierto, mostrar panel expandido
  if (groupJourney && isModalVisible) {
    return (
      <View style={styles.overlayContainer}>
        <Pressable 
          style={styles.backdrop} 
          onPress={() => setIsModalVisible(false)}
        />
        <View style={styles.panelContainer}>
          {renderModalContent()}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.simplePanelContainer}>
      {renderModalContent()}
    </View>
  );
});

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  panelContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
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
  simplePanelContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    // NO bloquea el mapa, solo ocupa su espacio en la parte inferior
  },
});

export default JourneyOverlay;