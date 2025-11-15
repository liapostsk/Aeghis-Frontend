import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';

// Importar APIs y tipos
import { JourneyDto, JourneyStates } from '@/api/backend/journeys/journeyType';
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
import { getParticipation } from '@/api/backend/participations/participationApi';
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

  // Estados de modales y UI
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [showGroupSelection, setShowGroupSelection] = useState(false);
  const [showJourneyOptions, setShowJourneyOptions] = useState(false);
  const [showGroupTypeSelector, setShowGroupTypeSelector] = useState(false);
  const [selectedGroupType, setSelectedGroupType] = useState<'CONFIANZA' | 'TEMPORAL' | null>(null);
  const [showJoinJourneyModal, setShowJoinJourneyModal] = useState(false); // ✅ NUEVO
  const [isUserParticipant, setIsUserParticipant] = useState(false); // ✅ NUEVO
  const [checkingParticipation, setCheckingParticipation] = useState(true); // ✅ NUEVO
  const [journeyState, setJourneyState] = useState<string>(groupJourney?.activeJourney.state || 'PENDING'); // ✅ NUEVO

  const {user} = useUserStore();

  // Hooks externos
  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);
  const { groups: userGroups, loading: groupsLoading } = useUserGroups(); // ✅ Usar hook con caché

  // ✅ NUEVO: Verificar si el usuario es participante cuando cambia el journey
  useEffect(() => {
    const checkIfUserIsParticipant = async () => {
      if (!groupJourney || !user) {
        setIsUserParticipant(false);
        setCheckingParticipation(false);
        return;
      }

      setCheckingParticipation(true);

      try {
        const participantsIds = groupJourney.activeJourney.participantsIds || [];
        
        if (participantsIds.length === 0) {
          console.log('🔍 No hay participantes en el journey');
          setIsUserParticipant(false);
          return;
        }

        // Verificar si alguna participación pertenece al usuario actual
        const participationChecks = await Promise.all(
          participantsIds.map(async (participationId) => {
            try {
              const participation = await getParticipation(participationId);
              return participation.userId === user.id;
            } catch (error) {
              console.warn('⚠️ Error verificando participación:', participationId, error);
              return false;
            }
          })
        );

        const isParticipant = participationChecks.some(result => result === true);
        setIsUserParticipant(isParticipant);
        
        console.log('🔍 Usuario es participante:', isParticipant);
      } catch (error) {
        console.error('❌ Error verificando participaciones:', error);
        setIsUserParticipant(false);
      } finally {
        setCheckingParticipation(false);
      }
    };

    checkIfUserIsParticipant();
  }, [groupJourney, user]);

  // ✅ NUEVO: Escuchar cambios de estado del journey en Firebase
  useEffect(() => {
    if (!groupJourney) {
      setJourneyState('PENDING');
      return;
    }

    const chatId = groupJourney.group.id.toString();
    const journeyId = groupJourney.activeJourney.id.toString();

    // Inicializar con el estado actual
    setJourneyState(groupJourney.activeJourney.state);

    console.log('👂 [JourneyOverlay] Escuchando estado del journey:', journeyId);

    const unsubscribe = listenJourneyState(
      chatId,
      journeyId,
      (newState, data) => {
        console.log('🔄 [JourneyOverlay] Estado del journey actualizado:', newState);
        setJourneyState(newState);
      },
      (error) => {
        console.error('❌ Error escuchando estado del journey:', error);
      }
    );

    return () => {
      console.log('🧹 [JourneyOverlay] Deteniendo listener de estado');
      unsubscribe();
    };
  }, [groupJourney]);

  // Referencias y configuración del Bottom Sheet
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [contentHeight, setContentHeight] = useState<number>(300); // Valor inicial más apropiado

    // Snap points dinámicos basados en el contenido
  const snapPoints = useMemo(() => {
    const tabHeight = 150; // Altura del tab colapsado más grande para ser más visible
    
    let expandedHeight;
    let context;
    
    if (groupJourney) {
      // Para journey activo: tab más visible y expandido al contenido
      expandedHeight = Math.max(contentHeight, 400); // Mínimo 400px
      context = 'journey activo';
    } else if (showJourneyOptions) {
      // Para opciones de grupo: tab más visible y expandido al contenido de la lista
      expandedHeight = Math.max(contentHeight, 500); // Mínimo 500px para opciones
      context = 'opciones de grupo';
    } else {
      // Para interfaz simple: tab más visible y altura del botón
      expandedHeight = Math.max(contentHeight, 250); // Mínimo 250px para botón
      context = 'interfaz simple';
    }
    
    const points = [tabHeight, expandedHeight];
    console.log('📐 Snap Points calculados:', { context, contentHeight, points });
    
    return points;
  }, [groupJourney, showJourneyOptions, contentHeight]);

  // Estado para rastrear si está colapsado
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Callbacks para manejar cambios del sheet
  const handleSheetChanges = useCallback((index: number) => {
    console.log('Bottom sheet cambió a índice:', index);
    setIsCollapsed(index === 0); // Actualizar estado de colapso
  }, []);

  // Callback para medir el contenido y ajustar snap points
  const handleContentLayout = useCallback((event: any) => {
    const { height } = event.nativeEvent.layout;
    // Agregar padding adicional para que no quede cortado
    const totalHeight = height + 100; // 100px de padding extra (safe area + márgenes)
    console.log('📏 Midiendo contenido - Altura:', height, '→ Total:', totalHeight);
    setContentHeight(totalHeight);
  }, []);

  // Función para expandir programáticamente
  const expandSheet = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(1); // Expandir al segundo snap point (contenido)
  }, []);

  // Auto-expandir el Bottom Sheet cuando hay contenido relevante
  useEffect(() => {
    const timer = setTimeout(() => {
      if (groupJourney || (!loading && !groupsLoading)) { // ✅ Usar groupsLoading del hook
        console.log('🔄 Auto-expandiendo BottomSheet:', { 
          hasGroupJourney: !!groupJourney, 
          loading, 
          groupsLoaded: !groupsLoading, // ✅ Invertir groupsLoading
          userGroupsCount: userGroups.length 
        });
        expandSheet();
      }
    }, 300); // Delay pequeño para asegurar que el sheet esté listo

    return () => clearTimeout(timer);
  }, [groupJourney, loading, groupsLoading, userGroups.length, expandSheet]); // ✅ Cambiar groupsLoaded por groupsLoading

  // Función para colapsar a tab
  const collapseToTab = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  // Funciones para manejar acciones
  const handleStartJourneyClick = () => {
    if (!showJourneyOptions) {
      setShowJourneyOptions(true);
    } else {
      onStartJourney(); // Mantener comportamiento original si ya están expandidas
    }
  };

  const handleCreateGroup = () => {
    // Si no hay grupos, mostrar selector de tipo
    if (userGroups.length === 0) {
      setShowGroupTypeSelector(true);
    } else {
      // Si ya hay grupos, crear directamente (será temporal por defecto)
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
    setShowGroupSelection(false);
    // Aquí se puede navegar directamente a la pantalla de journey con el grupo seleccionado
    // o almacenar el grupo seleccionado y llamar a onStartJourney
    console.log('🎯 Grupo seleccionado para iniciar journey:', group.name);
    onStartJourney();
  };

  const handleGroupCreated = () => {
    setShowCreateGroupModal(false);
    // ✅ Invalidar caché para que todos los componentes recarguen
    const { invalidateGroupsCache } = require('@/lib/hooks/useUserGroups');
    invalidateGroupsCache();
    console.log('🔄 Caché de grupos invalidado después de crear');
    
    // Navegar a la pantalla de journey del nuevo grupo
    onStartJourney();
  };

  // ✅ NUEVO: Función para manejar cuando el usuario se une exitosamente
  const handleJoinSuccess = (participation: ParticipationDto) => {
    console.log('✅ Usuario unido al trayecto exitosamente:', participation);
    setShowJoinJourneyModal(false);
    setIsUserParticipant(true); // Actualizar el estado inmediatamente
    
    // Opcional: Forzar recarga verificando participaciones de nuevo
    if (groupJourney && user) {
      setTimeout(() => {
        // Re-verificar después de un pequeño delay
        setCheckingParticipation(true);
      }, 500);
    }
  };

  // Renderizar el tab colapsado (estado mínimo)
  const renderCollapsedTab = () => {
    if (groupJourney) {
      return (
        <BottomSheetView style={styles.collapsedContainer}>
          <Pressable style={styles.collapsedContent} onPress={expandSheet}>
            
            <View style={styles.collapsedHeader}>
              <View style={styles.collapsedIconContainer}>
                <Ionicons name="navigate-circle" size={20} color="#4CAF50" />
                <View style={[
                  styles.statusDot,
                  { backgroundColor: groupJourney.activeJourney.state === 'IN_PROGRESS' ? '#4CAF50' : '#FF9800' }
                ]} />
              </View>
              
              <View style={styles.collapsedTextContainer}>
                <Text style={styles.collapsedTitle}>
                  {groupJourney.group.name}
                </Text>
                <Text style={styles.collapsedSubtitle}>
                  {groupJourney.activeJourney.state === 'IN_PROGRESS' ? 'En progreso' : 'Pendiente'} • 
                  {groupJourney.group.membersIds.length} participantes
                </Text>
              </View>
              
              <Ionicons name="chevron-up" size={20} color="#6B7280" />
            </View>
          </Pressable>
        </BottomSheetView>
      );
    } else {
      return (
        <BottomSheetView style={styles.collapsedContainer}>
          <Pressable style={styles.collapsedContent} onPress={expandSheet}>
            
            <View style={styles.collapsedHeader}>
              <View style={styles.collapsedIconContainer}>
                <Ionicons name="location" size={20} color="#7A33CC" />
              </View>
              
              <View style={styles.collapsedTextContainer}>
                <Text style={styles.collapsedTitle}>Iniciar Trayecto</Text>
                <Text style={styles.collapsedSubtitle}>Toca para ver opciones</Text>
              </View>
              
              <Ionicons name="chevron-up" size={20} color="#6B7280" />
            </View>
          </Pressable>
        </BottomSheetView>
      );
    }
  };

  // Renderizar contenido expandido
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

  // Versión adaptada para bottom sheet del journey activo
  const renderActiveJourneyFromGroupForSheet = (selectedGroupJourney: GroupWithJourney) => {
    // ✅ Usar el estado para determinar si puede controlar el trayecto
    const canControlJourney = isUserParticipant;
    const currentState = journeyState || selectedGroupJourney.activeJourney.state; // ✅ Usar estado local

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
            <Pressable 
              onPress={() => {
                // ParticipantsList maneja su propio refresh automáticamente
                console.log('Refresh manual solicitado - ParticipantsList lo maneja automáticamente');
              }} 
              style={styles.refreshButton}
              disabled={loading}
            >
              <Ionicons 
                name="refresh" 
                size={18} 
                color={loading ? '#9CA3AF' : '#6B7280'} 
              />
            </Pressable>
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
          
          {/* ✅ NUEVO: Mostrar botón de unirse si NO es participante */}
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

          {/* ✅ Solo mostrar controles si ES participante */}
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

        {/* ✅ Solo mostrar botón de finalizar si ES participante y está IN_PROGRESS */}
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

  // Función que renderiza el contenido según el estado del sheet
  const renderSheetContent = () => {
    // Si está colapsado, mostrar el tab
    if (isCollapsed) {
      return <JourneyCollapsedTab groupJourney={groupJourney} onExpand={expandSheet} />;
    }
    
    // Si está expandido, mostrar el contenido completo
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
  container: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
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
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionIcon: {
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
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
  modalOverlay: {
    position: 'absolute',
    top: -1000,
    left: -20,
    right: -20,
    bottom: -1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  groupsList: {
    maxHeight: 300,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  groupIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  groupMembers: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#7A33CC',
    fontWeight: '600',
  },
  simpleText: {
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 16,
  },
  simpleButton: {
    backgroundColor: '#6200ee',
    alignContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
  },
  simpleButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
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

  // Nuevos estilos para Bottom Sheet
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

  // Contenido del sheet
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
    transform: [{ scale: 0.8 }], // Hacer más pequeño para el header
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

  // Tab colapsado
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

  // Lista de participantes
  participantsListContent: {
    paddingBottom: 16,
  },

  // Indicador de batería
  batteryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    justifyContent: 'center',
  },
  batteryText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Contenedores de estado
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Sección de batería
  batterySection: {
    marginVertical: 16,
  },

  // Estilos para botones de acción
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

  // ✅ NUEVOS estilos para el contenedor de no participante
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

  // Nuevos estilos para la funcionalidad mejorada
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
  },
  
  groupType: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  
  groupDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  
  startJourneyButton: {
    marginLeft: 12,
  },
  
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },

  // Modal de selección de tipo de grupo
  
  groupTypeModal: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    maxWidth: 400,
    width: '90%',
  },
  
  groupTypeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  
  groupTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  typeIcon: {
    marginRight: 16,
  },
  
  typeInfo: {
    flex: 1,
  },
  
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  
  typeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  
  cancelButton: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  
  cancelButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
});

export default JourneyOverlay;
