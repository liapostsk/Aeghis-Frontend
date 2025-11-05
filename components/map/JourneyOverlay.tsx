import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';

// Importar APIs y tipos
import { JourneyDto, JourneyStates } from '@/api/journeys/journeyType';
import { UserDto } from '@/api/types';
import { Group, GROUP_TYPES } from '@/api/group/groupType';
import { User, useUserStore } from "../../lib/storage/useUserStorage";
import { getUserGroups } from '@/api/group/groupApi';

// Importar componentes y hooks de batería
import BatteryDisplay, { ParticipantsList } from '@/components/common/BatteryDisplay';

// Importar modales existentes
import CreateGroupModal from '@/components/groups/CreateGroupModal';
import JoinGroupModal from '@/components/groups/JoinGroupModal';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';

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
  const [activeJourney, setActiveJourney] = useState<JourneyDto | null>(null);
  
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true); // Cambiar a true para cargar grupos
  const [groupsLoaded, setGroupsLoaded] = useState(false);

  // Estados de modales y UI
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [showGroupSelection, setShowGroupSelection] = useState(false);
  const [showJourneyOptions, setShowJourneyOptions] = useState(false);
  const [showGroupTypeSelector, setShowGroupTypeSelector] = useState(false);
  const [selectedGroupType, setSelectedGroupType] = useState<'CONFIANZA' | 'TEMPORAL' | null>(null);

  const {user} = useUserStore();

  // Hooks externos
  const { getToken } = useAuth(); // Hook para obtener el token de autenticación
  const setToken = useTokenStore((state) => state.setToken); // Hook para guardar el token en el store

  // Cargar grupos del usuario al montar el componente
  useEffect(() => {
    let isMounted = true;

    const loadUserGroups = async () => {
      if (groupJourney) {
        // Si ya hay un journey activo, no necesitamos cargar grupos
        if (isMounted) {
          setLoading(false);
          setGroupsLoaded(true);
        }
        return;
      }

      if (groupsLoaded) {
        // Ya se cargaron los grupos, no volver a cargar
        return;
      }

      try {
        console.log('🔄 Cargando grupos del usuario...');
        const token = await getToken();
        if (isMounted) {
          setToken(token);
        }
        
        const groups = await getUserGroups();
        if (isMounted) {
          console.log('✅ Grupos cargados:', groups.length);
          setUserGroups(groups);
          setGroupsLoaded(true);
        }
      } catch (error) {
        console.error('💥 Error cargando grupos:', error);
        if (isMounted) {
          setUserGroups([]);
          setGroupsLoaded(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (!groupsLoaded) {
      loadUserGroups();
    }

    return () => {
      isMounted = false;
    };
  }, []); // Solo ejecutar una vez al montar el componente

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
      if (groupJourney || (!loading && groupsLoaded)) {
        console.log('🔄 Auto-expandiendo BottomSheet:', { 
          hasGroupJourney: !!groupJourney, 
          loading, 
          groupsLoaded,
          userGroupsCount: userGroups.length 
        });
        expandSheet();
      }
    }, 300); // Delay pequeño para asegurar que el sheet esté listo

    return () => clearTimeout(timer);
  }, [groupJourney, loading, groupsLoaded, userGroups.length, expandSheet]);

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

  const handleShowGroupSelection = () => {
    setShowGroupSelection(true);
  };

  const handleGroupCreated = () => {
    setShowCreateGroupModal(false);
    // Recargar datos después de crear grupo - actualizar lista
    const reloadGroups = async () => {
      try {
        const groups = await getUserGroups();
        setUserGroups(groups);
        console.log('🔄 Grupos recargados después de crear:', groups.length);
      } catch (error) {
        console.error('Error recargando grupos:', error);
      }
    };
    reloadGroups();
    
    // Navegar a la pantalla de journey del nuevo grupo
    onStartJourney();
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
      return renderGroupOptionsForSheet();
    } else {
      return renderSimpleInterfaceForSheet();
    }
  };

  // Versión adaptada para bottom sheet del journey activo
  const renderActiveJourneyFromGroupForSheet = (selectedGroupJourney: GroupWithJourney) => {

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
                userId={user.id} // TODO: Obtener el ID del usuario actual
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
            Estado: {selectedGroupJourney.activeJourney.state === 'IN_PROGRESS' ? 'En progreso' : 'Pendiente'}
          </Text>
          
          {selectedGroupJourney.activeJourney.state === 'PENDING' && (
            <Pressable style={styles.startButton} onPress={onStartJourney}>
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.startButtonText}>Iniciar Trayecto</Text>
            </Pressable>
          )}
          
          {selectedGroupJourney.activeJourney.state === 'IN_PROGRESS' && (
            <View style={styles.actionButtonsContainer}>
              <Text style={styles.inProgressText}>
                🟢 Trayecto en curso • Ubicación compartida
              </Text>
            </View>
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

        {selectedGroupJourney.activeJourney.state === 'IN_PROGRESS' && onCompleteJourney && (
          <View style={styles.sheetFooter}>
            <Pressable style={styles.endButton} onPress={onCompleteJourney}>
              <Ionicons name="stop-circle" size={20} color="#FFFFFF" />
              <Text style={styles.endButtonText}>Finalizar Trayecto</Text>
            </Pressable>
          </View>
        )}
      </BottomSheetView>
    );
  };

  // Versión adaptada para bottom sheet de opciones simples
  const renderSimpleInterfaceForSheet = () => (
    <BottomSheetView 
      style={styles.sheetContent}
      onLayout={handleContentLayout}
    >
      
      <Text style={styles.simpleText}>
        You're currently not on a trip. Activate one if you'd like someone to keep an eye on you 😊
      </Text>
      
      <Pressable style={styles.simpleButton} onPress={() => setShowJourneyOptions(true)}>
        <Text style={styles.simpleButtonText}>Start a journey</Text>
      </Pressable>
    </BottomSheetView>
  );

  // Versión adaptada para bottom sheet de opciones de grupo
  const renderGroupOptionsForSheet = () => {
    const hasGroups = userGroups.length > 0;

    return (
      <BottomSheetView 
        style={styles.sheetContent}
        onLayout={handleContentLayout}
      >
        <View style={styles.sheetHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="location" size={24} color="#7A33CC" />
            <Text style={styles.sheetTitle}>
              {hasGroups ? 'Iniciar Trayecto' : 'Crear tu Primer Trayecto'}
            </Text>
          </View>
          <Pressable onPress={() => setShowJourneyOptions(false)} style={styles.collapseButton}>
            <Ionicons name="close" size={20} color="#6B7280" />
          </Pressable>
        </View>

        <Text style={styles.subtitle}>
          {hasGroups 
            ? `Tienes ${userGroups.length} grupo${userGroups.length > 1 ? 's' : ''} disponible${userGroups.length > 1 ? 's' : ''}. ¿Con cuál quieres empezar?`
            : 'Para iniciar un trayecto necesitas un grupo. ¿Qué te gustaría hacer?'
          }
        </Text>

        <BottomSheetScrollView 
          contentContainerStyle={styles.optionsContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Si tiene grupos, mostrar lista de grupos existentes */}
          {hasGroups && (
            <>
              <Text style={styles.sectionTitle}>Tus grupos:</Text>
              {userGroups.map((group) => (
                <Pressable 
                  key={group.id} 
                  style={styles.groupCard} 
                  onPress={() => handleGroupSelected(group)}
                >
                  <View style={styles.groupIcon}>
                    <Ionicons 
                      name={group.type === 'CONFIANZA' ? 'shield' : group.type === 'TEMPORAL' ? 'time' : 'people'} 
                      size={24} 
                      color="#7A33CC" 
                    />
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupType}>
                      {group.type} • {group.membersIds.length} miembro{group.membersIds.length > 1 ? 's' : ''}
                    </Text>
                    {group.description && (
                      <Text style={styles.groupDescription}>{group.description}</Text>
                    )}
                  </View>
                  <View style={styles.startJourneyButton}>
                    <Ionicons name="play-circle" size={32} color="#4CAF50" />
                  </View>
                </Pressable>
              ))}
              
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Más opciones:</Text>
            </>
          )}

          {/* Crear nuevo grupo */}
          <Pressable style={styles.optionCard} onPress={handleCreateGroup}>
            <View style={styles.optionIcon}>
              <Ionicons name="add-circle" size={32} color="#4CAF50" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>
                {hasGroups ? 'Crear Otro Grupo' : 'Crear Grupo'}
              </Text>
              <Text style={styles.optionDescription}>
                {hasGroups 
                  ? 'Crea un nuevo grupo temporal o de confianza'
                  : 'Crea un grupo de confianza o temporal'
                }
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </Pressable>

          {/* Unirse a grupo */}
          <Pressable style={styles.optionCard} onPress={handleJoinGroup}>
            <View style={styles.optionIcon}>
              <Ionicons name="person-add" size={32} color="#FF9800" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Unirse a Grupo</Text>
              <Text style={styles.optionDescription}>
                Únete a un grupo existente con código de invitación
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </Pressable>
        </BottomSheetScrollView>

        {/* Modales */}
        {renderModals()}
      </BottomSheetView>
    );
  };

  // Función separada para renderizar modales
  const renderModals = () => (
    <>
      {/* Modal selector de tipo de grupo */}
      {showGroupTypeSelector && (
        <View style={styles.modalOverlay}>
          <View style={styles.groupTypeModal}>
            <Text style={styles.groupTypeTitle}>¿Qué tipo de grupo quieres crear?</Text>
            
            <Pressable 
              style={styles.groupTypeOption} 
              onPress={() => handleCreateGroupWithType('CONFIANZA')}
            >
              <View style={styles.typeIcon}>
                <Ionicons name="shield" size={32} color="#7A33CC" />
              </View>
              <View style={styles.typeInfo}>
                <Text style={styles.typeName}>Grupo de Confianza</Text>
                <Text style={styles.typeDescription}>
                  Para familia y amigos cercanos. Permanente y con más funciones de seguridad.
                </Text>
              </View>
            </Pressable>

            <Pressable 
              style={styles.groupTypeOption} 
              onPress={() => handleCreateGroupWithType('TEMPORAL')}
            >
              <View style={styles.typeIcon}>
                <Ionicons name="time" size={32} color="#FF9800" />
              </View>
              <View style={styles.typeInfo}>
                <Text style={styles.typeName}>Grupo Temporal</Text>
                <Text style={styles.typeDescription}>
                  Para ocasiones específicas. Se puede configurar para expirar automáticamente.
                </Text>
              </View>
            </Pressable>

            <Pressable 
              style={styles.cancelButton} 
              onPress={() => setShowGroupTypeSelector(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Modal de crear grupo con tipo */}
      <CreateGroupModal
        visible={showCreateGroupModal}
        onClose={() => {
          setShowCreateGroupModal(false);
          setSelectedGroupType(null);
        }}
        onSuccess={handleGroupCreated}
        type={selectedGroupType || 'TEMPORAL'}
      />

      {/* Modal de unirse a grupo */}
      <JoinGroupModal
        visible={showJoinGroupModal}
        onClose={() => setShowJoinGroupModal(false)}
      />
    </>
  );

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
    // Siempre mostrar el contenido expandido ya que el BottomSheet maneja el colapso automáticamente
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
