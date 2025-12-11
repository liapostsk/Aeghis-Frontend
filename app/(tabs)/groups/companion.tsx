import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/lib/storage/useUserStorage';
import ProfileVerificationScreen from '@/components/profile/ProfileVerificationScreen';
import { 
  createCompanionRequest, 
  listActiveCompanionRequests,
  getMyCompanionRequests,
  deleteCompanionRequest
} from '@/api/backend/companionRequest/companionRequestApi';
import { CompanionRequestDto, CreateCompanionRequestDto } from '@/api/backend/companionRequest/companionTypes';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import CompanionRequestList from '@/components/groups/companion/CompanionRequestList';
import CreateCompanionRequest from '@/components/groups/companion/CreateCompanionRequest';
import ManageCompanionRequest from '@/components/groups/companion/ManageCompanionRequest';
import RequestJoinCompanion from '@/components/groups/companion/RequestJoinCompanion';
import CompanionTabs from '@/components/groups/companion/CompanionTabs';


type CompanionRequest = CompanionRequestDto;

export default function CompanionsGroups() {
  const { user } = useUserStore();
  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);
  const [showVerification, setShowVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [listTab, setListTab] = useState<'explore' | 'mine'>('explore');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Estados de búsqueda y filtros
  const [exploreRequests, setExploreRequests] = useState<CompanionRequest[]>([]);
  const [myRequests, setMyRequests] = useState<CompanionRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [managingRequest, setManagingRequest] = useState<CompanionRequestDto | null>(null);
  const [requestingToJoin, setRequestingToJoin] = useState<CompanionRequestDto | null>(null);
  const verifyStatus = user?.verify;


  useEffect(() => {
    console.log("Comprobando estado de verificación...", { user, verifyStatus });
    if (!user) {
      setIsLoading(true);
      return;
    }
    if (verifyStatus === 'VERIFIED') {
      setShowVerification(false);
    } else {
      setShowVerification(true);
    }
    setIsLoading(false);
  }, [user, verifyStatus]);

  const handleVerificationComplete = () => {
    setShowVerification(false);
  };

  const loadExploreRequests = async () => {
    try {
      const token = await getToken();
      setToken(token);
      
      const activeRequests = await listActiveCompanionRequests();
      setExploreRequests(activeRequests);
    } catch (error) {
      console.error('Error cargando solicitudes para explorar:', error);
    }
  };

  const loadMyRequests = async () => {
    try {
      const token = await getToken();
      setToken(token);
      
      const myRequestsList = await getMyCompanionRequests();
      setMyRequests(myRequestsList);
    } catch (error) {
      console.error('Error cargando mis solicitudes:', error);
    }
  };

  const loadRequests = async () => {
    if (listTab === 'explore') {
      await loadExploreRequests();
    } else {
      await loadMyRequests();
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  useEffect(() => {
    if (verifyStatus === 'VERIFIED') {
      loadRequests();
    }
  }, [verifyStatus, listTab]);

  const handleCreateRequest = async (requestData: CreateCompanionRequestDto) => {
    try {
      const token = await getToken();
      setToken(token);
      
      await createCompanionRequest(requestData);
      // Recargar ambas listas
      await loadExploreRequests();
      await loadMyRequests();
      // Cerrar modal y cambiar a tab "Mis Solicitudes" para ver la nueva solicitud
      setShowCreateModal(false);
      setListTab('mine');
    } catch (error) {
      console.error('Error creando solicitud:', error);
    }
  };

  const handleJoinRequest = (request: CompanionRequestDto) => {
    setRequestingToJoin(request);
  };

  const handleRequestPress = (request: CompanionRequestDto) => {
    console.log('Solicitud seleccionada:', request);
    // Aquí puedes navegar a una pantalla de detalle o mostrar más información
  };

  const handleManageRequest = (request: CompanionRequestDto) => {
    setManagingRequest(request);
  };

  const handleDeleteRequest = async (requestId: number) => {
    Alert.alert(
      'Eliminar solicitud',
      '¿Estás seguro de que quieres eliminar esta solicitud de acompañamiento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              setToken(token);
              
              await deleteCompanionRequest(requestId);
              console.log('Solicitud eliminada:', requestId);
              await loadRequests();
              Alert.alert('Éxito', 'Solicitud eliminada correctamente');
            } catch (error) {
              console.error('Error eliminando solicitud:', error);
              Alert.alert('Error', 'No se pudo eliminar la solicitud');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (verifyStatus !== 'VERIFIED') {
    if (verifyStatus === 'PENDING') {
      return (
        <View style={styles.pendingContainer}>
          <Ionicons name="shield-checkmark" size={64} color="#7A33CC" style={{ marginBottom: 24 }} />
          <Text style={styles.pendingTitle}>Verificación en proceso</Text>
          <Text style={styles.pendingText}>
            Tus fotos han sido enviadas correctamente. Un administrador revisará tu identidad en breve.
          </Text>
        </View>
      );
    }
  }

  if (verifyStatus !== 'VERIFIED') {
    return (
      <ProfileVerificationScreen
        onVerificationComplete={handleVerificationComplete}
      />
    );
  }

  // Si estamos creando una solicitud, mostrar la pantalla de creación
  if (showCreateModal) {
    return (
      <CreateCompanionRequest
        onCreateRequest={handleCreateRequest}
        onSuccess={() => {
          setShowCreateModal(false);
          setListTab('mine');
        }}
        onCancel={() => setShowCreateModal(false)}
      />
    );
  }

  // Si estamos solicitando unirse a una solicitud, mostrar la pantalla de solicitud
  if (requestingToJoin) {
    return (
      <RequestJoinCompanion
        request={requestingToJoin}
        onClose={() => setRequestingToJoin(null)}
        onRequestSent={() => {
          setRequestingToJoin(null);
          loadRequests();
        }}
      />
    );
  }

  // Si estamos gestionando una solicitud, mostrar la pantalla de gestión
  if (managingRequest) {
    return (
      <ManageCompanionRequest
        request={managingRequest}
        onClose={() => setManagingRequest(null)}
        onRequestUpdated={() => {
          setManagingRequest(null);
          loadRequests();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs: Explorar y Mis Solicitudes */}
      <CompanionTabs
        activeTab={listTab}
        onTabChange={setListTab}
      />
      
      {/* Lista de solicitudes */}
      <CompanionRequestList
        requests={listTab === 'explore' ? exploreRequests : myRequests}
        onRequestPress={handleRequestPress}
        onJoinRequest={handleJoinRequest}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        currentUserId={user?.id}
        onManageRequest={handleManageRequest}
        onDeleteRequest={handleDeleteRequest}
      />

      {/* Botón flotante para crear solicitud */}
      <Pressable
        style={styles.floatingButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pendingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 32,
  },
  pendingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  pendingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7A33CC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
