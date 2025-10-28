import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Importar APIs y tipos
import { JourneyDto, JourneyStates } from '@/api/journeys/journeyType';
import { ParticipationDto } from '@/api/participations/participationType';
import { UserDto } from '@/api/types';
import { Group } from '@/api/group/groupType';
import { getCurrentJourneyForGroup } from '@/api/journeys/journeyApi';
import { getCurrentUser } from '@/api/user/userApi';
import { getUserGroupsByType } from '@/api/group/groupApi';

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

interface ParticipantStatus {
  user: UserDto;
  batteryLevel: number;
  isConnected: boolean;
  lastSeen: Date;
}

export default function JourneyOverlay({ groupJourney, onStartJourney }: Props) {
  // Estados principales
  const [activeJourney, setActiveJourney] = useState<JourneyDto | null>(null);
  const [participantsStatus, setParticipantsStatus] = useState<ParticipantStatus[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(false); // Cambiar a false ya que no tenemos carga inicial activa

  // Estados de modales y UI
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [showGroupSelection, setShowGroupSelection] = useState(false);
  const [showJourneyOptions, setShowJourneyOptions] = useState(false);

  // Hooks externos
    const { getToken } = useAuth(); // Hook para obtener el token de autenticación
    const setToken = useTokenStore((state) => state.setToken); // Hook para guardar el token en el store

  // Cargar datos iniciales
  /*
  useEffect(() => {
    loadJourneyData();
    const interval = setInterval(loadJourneyData, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);
  */

  /*
  const loadJourneyData = async () => {
    try {
      setLoading(true);

      const token = await getToken();
      setToken(token);
      
      // Obtener usuario actual
      const user = await getCurrentUser();
      setCurrentUser(user);

      // Buscar journeys activos
      const activeJourneys = await getActiveJourneys();
      const userActiveJourney = activeJourneys.find(journey => 
        journey.participantsIds?.includes(user.id) && 
        journey.state === JourneyStates.IN_PROGRESS
      );

      if (userActiveJourney) {
        setActiveJourney(userActiveJourney);
        await loadParticipantsStatus(userActiveJourney);
      } else {
        setActiveJourney(null);
        // Cargar grupos del usuario para mostrar opciones
        const groups = await getUserGroups();
        setUserGroups(groups);
      }
    } catch (error) {
      console.error('Error loading journey data:', error);
    } finally {
      setLoading(false);
    }
  };
  */

  const loadParticipantsStatus = async (journey: JourneyDto) => {
    try {
      // TODO: Implementar API para obtener estado de participantes
      // Por ahora simulamos algunos datos
      const mockStatus: ParticipantStatus[] = [
        {
          user: { id: 1, name: "Usuario 1", email: "user1@test.com", phone: "123456789", image: "", verify: true, dateOfBirth: new Date(), acceptedPrivacyPolicy: true, safeLocations: [], role: "USER" },
          batteryLevel: 85,
          isConnected: true,
          lastSeen: new Date(Date.now() - 2 * 60 * 1000) // 2 minutos atrás
        },
        {
          user: { id: 2, name: "Usuario 2", email: "user2@test.com", phone: "987654321", image: "", verify: true, dateOfBirth: new Date(), acceptedPrivacyPolicy: true, safeLocations: [], role: "USER" },
          batteryLevel: 42,
          isConnected: false,
          lastSeen: new Date(Date.now() - 10 * 60 * 1000) // 10 minutos atrás
        }
      ];
      
      setParticipantsStatus(mockStatus);
    } catch (error) {
      console.error('Error loading participants status:', error);
    }
  };

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

  // Renderizar información del journey activo desde MapHeader
  const renderActiveJourneyFromGroup = (selectedGroupJourney: GroupWithJourney) => {
    // Crear datos mockeados de participantes basados en los miembros del grupo
    const mockParticipants: ParticipantStatus[] = selectedGroupJourney.group.membersIds.map((memberId, index) => ({
      user: { 
        id: memberId, 
        name: `Usuario ${index + 1}`, 
        email: `user${index + 1}@test.com`, 
        phone: `12345678${index}`, 
        image: "", 
        verify: true, 
        dateOfBirth: new Date(), 
        acceptedPrivacyPolicy: true, 
        safeLocations: [], 
        role: "USER" 
      },
      batteryLevel: Math.floor(Math.random() * 80) + 20, // Entre 20% y 100%
      isConnected: Math.random() > 0.3, // 70% probabilidad de estar conectado
      lastSeen: new Date(Date.now() - Math.random() * 15 * 60 * 1000) // Hasta 15 minutos atrás
    }));

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="navigate-circle" size={24} color="#4CAF50" />
          <Text style={styles.title}>Trayecto Activo</Text>
          <View style={[
            styles.statusDot, 
            { backgroundColor: selectedGroupJourney.activeJourney.state === 'IN_PROGRESS' ? '#4CAF50' : '#FF9800' }
          ]} />
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

        {/* Mostrar información de participantes mockeada */}
        <ScrollView style={styles.participantsList} showsVerticalScrollIndicator={false}>
          {mockParticipants.map((participant) => (
            <View key={participant.user.id} style={styles.participantCard}>
              <View style={styles.participantInfo}>
                <View style={styles.participantAvatar}>
                  <Text style={styles.participantAvatarText}>
                    {participant.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.participantDetails}>
                  <Text style={styles.participantName}>{participant.user.name}</Text>
                  <Text style={styles.participantLastSeen}>
                    Visto hace {Math.floor((Date.now() - participant.lastSeen.getTime()) / 60000)} min
                  </Text>
                </View>
              </View>

              <View style={styles.participantStatus}>
                {/* Nivel de batería */}
                <View style={styles.statusItem}>
                  <Ionicons 
                    name="battery-half" 
                    size={16} 
                    color={participant.batteryLevel > 20 ? '#4CAF50' : '#FF5722'} 
                  />
                  <Text style={[
                    styles.statusText,
                    { color: participant.batteryLevel > 20 ? '#4CAF50' : '#FF5722' }
                  ]}>
                    {participant.batteryLevel}%
                  </Text>
                </View>

                {/* Conexión a internet */}
                <View style={styles.statusItem}>
                  <Ionicons 
                    name={participant.isConnected ? "wifi" : "wifi-outline"} 
                    size={16} 
                    color={participant.isConnected ? '#4CAF50' : '#FF5722'} 
                  />
                  <Text style={[
                    styles.statusText,
                    { color: participant.isConnected ? '#4CAF50' : '#FF5722' }
                  ]}>
                    {participant.isConnected ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {selectedGroupJourney.activeJourney.state === 'IN_PROGRESS' && (
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
        )}
      </View>
    );
  };

  // Renderizar información del journey activo
  const renderActiveJourney = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="navigate-circle" size={24} color="#4CAF50" />
        <Text style={styles.title}>Trayecto Activo</Text>
        <View style={styles.statusDot} />
      </View>

      <Text style={styles.journeyName}>
        {`Trayecto - ${activeJourney?.journeyType || 'En curso'}`}
      </Text>

      <ScrollView style={styles.participantsList} showsVerticalScrollIndicator={false}>
        {participantsStatus.map((participant) => (
          <View key={participant.user.id} style={styles.participantCard}>
            <View style={styles.participantInfo}>
              <View style={styles.participantAvatar}>
                <Text style={styles.participantAvatarText}>
                  {participant.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </Text>
              </View>
              <View style={styles.participantDetails}>
                <Text style={styles.participantName}>{participant.user.name}</Text>
                <Text style={styles.participantLastSeen}>
                  Visto hace {Math.floor((Date.now() - participant.lastSeen.getTime()) / 60000)} min
                </Text>
              </View>
            </View>

            <View style={styles.participantStatus}>
              {/* Nivel de batería */}
              <View style={styles.statusItem}>
                <Ionicons 
                  name="battery-half" 
                  size={16} 
                  color={participant.batteryLevel > 20 ? '#4CAF50' : '#FF5722'} 
                />
                <Text style={[
                  styles.statusText,
                  { color: participant.batteryLevel > 20 ? '#4CAF50' : '#FF5722' }
                ]}>
                  {participant.batteryLevel}%
                </Text>
              </View>

              {/* Conexión a internet */}
              <View style={styles.statusItem}>
                <Ionicons 
                  name={participant.isConnected ? "wifi" : "wifi-outline"} 
                  size={16} 
                  color={participant.isConnected ? '#4CAF50' : '#FF5722'} 
                />
                <Text style={[
                  styles.statusText,
                  { color: participant.isConnected ? '#4CAF50' : '#FF5722' }
                ]}>
                  {participant.isConnected ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Pressable style={styles.endButton} onPress={() => {
        Alert.alert(
          'Finalizar trayecto',
          '¿Estás seguro de que quieres finalizar el trayecto?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Finalizar', onPress: () => setActiveJourney(null) }
          ]
        );
      }}>
        <Ionicons name="stop-circle" size={20} color="#FFFFFF" />
        <Text style={styles.endButtonText}>Finalizar Trayecto</Text>
      </Pressable>
    </View>
  );

  // Renderizar interfaz simple inicial
  const renderSimpleInterface = () => (
    <View style={styles.simpleContainer}>
      <Text style={styles.simpleText}>
        You're currently not on a trip. Activate one if you'd like someone to keep an eye on you 😊
      </Text>
      <Pressable style={styles.simpleButton} onPress={handleStartJourneyClick}>
        <Text style={styles.simpleButtonText}>Start a journey</Text>
      </Pressable>
    </View>
  );

  // Renderizar opciones para crear/unirse a grupos
  const renderGroupOptions = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="location" size={24} color="#7A33CC" />
        <Text style={styles.title}>Iniciar Trayecto</Text>
        <Pressable onPress={() => setShowJourneyOptions(false)} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#6B7280" />
        </Pressable>
      </View>

      <Text style={styles.subtitle}>
        No tienes ningún trayecto activo. ¿Qué te gustaría hacer?
      </Text>

      <View style={styles.optionsContainer}>
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

        {/* Unirse a grupo */}
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

        {/* Seleccionar grupo existente */}
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
      </View>

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

      {/* Modal de selección de grupo */}
      {showGroupSelection && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Seleccionar Grupo</Text>
            <ScrollView style={styles.groupsList}>
              {userGroups.map((group) => (
                <Pressable 
                  key={group.id} 
                  style={styles.groupCard}
                  onPress={() => handleGroupSelected(group)}
                >
                  <View style={styles.groupIcon}>
                    <Ionicons name="people" size={20} color="#7A33CC" />
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupMembers}>
                      {group.membersIds.length} miembros
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#ccc" />
                </Pressable>
              ))}
            </ScrollView>
            <Pressable 
              style={styles.modalCloseButton}
              onPress={() => setShowGroupSelection(false)}
            >
              <Text style={styles.modalCloseText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  // Si hay grupo con journey seleccionado desde el MapHeader, usar esa información
  if (groupJourney) {
    return renderActiveJourneyFromGroup(groupJourney);
  }

  // Si hay journey activo local, mostrar información del journey
  if (activeJourney) {
    return renderActiveJourney();
  }

  // Si NO hay grupo seleccionado desde MapHeader, mostrar opciones para crear/unirse a grupos
  // Si no hay journey activo y no se han expandido las opciones, mostrar interfaz simple
  if (!showJourneyOptions) {
    return renderSimpleInterface();
  }

  // Si se han expandido las opciones, mostrar opciones de grupo (CreateGroupModal, JoinGroupModal)
  return renderGroupOptions();
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
  closeButton: {
    padding: 4,
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
  participantCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7A33CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  participantAvatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  participantLastSeen: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  participantStatus: {
    alignItems: 'flex-end',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
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

  // Simple interface styles
  simpleContainer: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
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
});
