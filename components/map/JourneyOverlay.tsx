import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';

// Importar APIs y tipos
import { JourneyDto, JourneyStates } from '@/api/journeys/journeyType';
import { UserDto } from '@/api/types';
import { Group } from '@/api/group/groupType';
import { User, useUserStore } from "../../lib/storage/useUserStorage";

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
}

export default function JourneyOverlay({ groupJourney, onStartJourney }: Props) {
  // Estados principales
  const [activeJourney, setActiveJourney] = useState<JourneyDto | null>(null);
  
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(false); // Cambiar a false ya que no tenemos carga inicial activa

  // Estados de modales y UI
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [showGroupSelection, setShowGroupSelection] = useState(false);
  const [showJourneyOptions, setShowJourneyOptions] = useState(false);

  const {user} = useUserStore();

  // Hooks externos
  const { getToken } = useAuth(); // Hook para obtener el token de autenticación
  const setToken = useTokenStore((state) => state.setToken); // Hook para guardar el token en el store

  // Referencias y configuración del Bottom Sheet
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Snap points: collapsed (pequeño tab), half (medio), expanded (completo)
  const snapPoints = useMemo(() => {
    if (groupJourney) {
      // Para journey activo: tab pequeño, medio, completo
      return ['12%', '60%'];
    } else {
      // Para opciones de crear/unirse: solo pequeño y completo
      return ['12%', '25%', '50%'];
    }
  }, [groupJourney]);

  // Callbacks para manejar cambios del sheet
  const handleSheetChanges = useCallback((index: number) => {
    console.log('Bottom sheet cambió a índice:', index);
  }, []);

  // Función para expandir programáticamente
  const expandSheet = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

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
    setShowCreateGroupModal(true);
  };

  const handleJoinGroup = () => {
    setShowJoinGroupModal(true);
  };

  const handleSelectExistingGroup = () => {
    setShowGroupSelection(true);
  };

  const handleGroupCreated = () => {
    setShowCreateGroupModal(false);
    // Recargar datos después de crear grupo
    //loadJourneyData();
    // Navegar a la pantalla de journey del nuevo grupo
    onStartJourney();
  };

  const handleGroupSelected = (group: Group) => {
    setShowGroupSelection(false);
    // Navegar a la pantalla de journey del grupo seleccionado
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
      <BottomSheetView style={styles.sheetContent}>
        
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
        </View>

        {/* Lista de participantes usando el componente dedicado */}
        <BottomSheetScrollView 
          style={styles.participantsList} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.participantsListContent}
        >
          <ParticipantsList 
            participants={selectedGroupJourney.group.membersIds.map((memberId, index) => ({
              id: memberId,
              name: `Usuario ${index + 1}`, // TODO: Obtener nombres reales de la API
              email: `user${index + 1}@example.com`,
              phone: `12345678${index}`
            }))}
            autoRefresh={true}
            refreshInterval={30000}
          />
        </BottomSheetScrollView>

        {selectedGroupJourney.activeJourney.state === 'IN_PROGRESS' && (
          <View style={styles.sheetFooter}>
            <Pressable style={styles.endButton} onPress={() => {
              Alert.alert(
                'Finalizar trayecto',
                '¿Estás seguro de que quieres finalizar el trayecto?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Finalizar', onPress: () => console.log('Finalizar trayecto') }
                ]
              );
            }}>
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
    <BottomSheetView style={styles.sheetContent}>
      
      <Text style={styles.simpleText}>
        You're currently not on a trip. Activate one if you'd like someone to keep an eye on you 😊
      </Text>
      
      <Pressable style={styles.simpleButton} onPress={() => setShowJourneyOptions(true)}>
        <Text style={styles.simpleButtonText}>Start a journey</Text>
      </Pressable>
    </BottomSheetView>
  );

  // Versión adaptada para bottom sheet de opciones de grupo
  const renderGroupOptionsForSheet = () => (
    <BottomSheetView style={styles.sheetContent}>
      <View style={styles.sheetHeader}>
        <View style={styles.headerLeft}>
          <Ionicons name="location" size={24} color="#7A33CC" />
          <Text style={styles.sheetTitle}>Iniciar Trayecto</Text>
        </View>
        <Pressable onPress={() => setShowJourneyOptions(false)} style={styles.collapseButton}>
          <Ionicons name="close" size={20} color="#6B7280" />
        </Pressable>
      </View>

      <Text style={styles.subtitle}>
        No tienes ningún trayecto activo. ¿Qué te gustaría hacer?
      </Text>

      <BottomSheetScrollView 
        contentContainerStyle={styles.optionsContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Crear nuevo grupo */}
        <Pressable style={styles.optionCard} onPress={handleCreateGroup}>
          <View style={styles.optionIcon}>
            <Ionicons name="add-circle" size={32} color="#4CAF50" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Crear Grupo</Text>
            <Text style={styles.optionDescription}>
              Crea un nuevo grupo e invita personas
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </Pressable>

        <Pressable style={styles.optionCard} onPress={handleJoinGroup}>
          <View style={styles.optionIcon}>
            <Ionicons name="person-add" size={32} color="#FF9800" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Unirse a Grupo</Text>
            <Text style={styles.optionDescription}>
              Únete a un grupo existente con código
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </Pressable>

        {userGroups.length > 0 && (
          <Pressable style={styles.optionCard} onPress={handleSelectExistingGroup}>
            <View style={styles.optionIcon}>
              <Ionicons name="people" size={32} color="#7A33CC" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Mis Grupos</Text>
              <Text style={styles.optionDescription}>
                Iniciar trayecto con uno de mis {userGroups.length} grupos
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </Pressable>
        )}
      </BottomSheetScrollView>

      {/* Modales */}
      <CreateGroupModal
        visible={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onSuccess={handleGroupCreated}
      />

      <JoinGroupModal
        visible={showJoinGroupModal}
        onClose={() => setShowJoinGroupModal(false)}
      />
    </BottomSheetView>
  );

  if (loading) {
    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={['20%']}
        onChange={handleSheetChanges}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </BottomSheetView>
      </BottomSheet>
    );
  }

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
      {renderExpandedContent()}
    </BottomSheet>
  );
}

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
  
  // Header styles
  header: {
    flexDirection: 'row',
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

  // Journey active styles
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
  // Group options styles
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

  // Buttons
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

  // Modal styles
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
  },
  simpleButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Loading
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
  },

  // Journey info styles
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
});
