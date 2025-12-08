import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/lib/storage/useUserStorage';
import ProfileVerificationScreen from '@/components/profile/ProfileVerificationScreen';
import { Location } from '@/api/backend/locations/locationType';
import { 
  createCompanionRequest, 
  listActiveCompanionRequests,
  requestToJoinCompanionRequest 
} from '@/api/backend/companionRequest/companionRequestApi';
import { CompanionRequestDto } from '@/api/backend/types';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import CompanionRequestList from '@/components/groups/companion/CompanionRequestList';
import CreateCompanionRequest from '@/components/groups/companion/CreateCompanionRequest';


type CompanionRequest = CompanionRequestDto;

export default function CompanionsGroups() {
  const { user } = useUserStore();
  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);
  const [showVerification, setShowVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'create' | 'search'>('search');
  
  // Estados de búsqueda y filtros
  const [requests, setRequests] = useState<CompanionRequest[]>([]);
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

  const loadRequests = async () => {
    try {
      const token = await getToken();
      setToken(token);
      
      const activeRequests = await listActiveCompanionRequests();
      setRequests(activeRequests);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    }
  };

  useEffect(() => {
    if (verifyStatus === 'VERIFIED') {
      loadRequests();
    }
  }, [verifyStatus]);

  const handleCreateRequest = async (
    requestData: Partial<CompanionRequestDto>,
    sourceId: number,
    destinationId: number
  ) => {
    const token = await getToken();
    setToken(token);
    
    const newRequest: CompanionRequestDto = {
      sourceId: sourceId,
      destinationId: destinationId,
      creationDate: new Date(),
      state: 'CREATED',
      description: requestData.description,
      id: 0,
      creatorId: user?.id || 0,
      companionId: 0,
    };
    
    await createCompanionRequest(newRequest);
    loadRequests();
  };

  const handleJoinRequest = async (requestId: number) => {
    try {
      const token = await getToken();
      setToken(token);
      
      await requestToJoinCompanionRequest(requestId);
      console.log('Solicitud de unión enviada');
      loadRequests();
    } catch (error) {
      console.error('Error uniéndose a solicitud:', error);
    }
  };

  const handleRequestPress = (request: CompanionRequestDto) => {
    console.log('Solicitud seleccionada:', request);
    // Aquí puedes navegar a una pantalla de detalle o mostrar más información
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

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'search' && styles.tabActive]}
          onPress={() => setActiveTab('search')}
        >
          <Ionicons 
            name="search" 
            size={20} 
            color={activeTab === 'search' ? '#7A33CC' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>
            Buscar
          </Text>
        </Pressable>
        
        <Pressable
          style={[styles.tab, activeTab === 'create' && styles.tabActive]}
          onPress={() => setActiveTab('create')}
        >
          <Ionicons 
            name="add-circle" 
            size={20} 
            color={activeTab === 'create' ? '#7A33CC' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
            Crear solicitud
          </Text>
        </Pressable>
      </View>

      {/* Contenido según el tab activo */}
      {activeTab === 'create' ? (
        <CreateCompanionRequest
          onCreateRequest={handleCreateRequest}
          onSuccess={() => setActiveTab('search')}
        />
      ) : (
        <CompanionRequestList
          requests={requests}
          onRequestPress={handleRequestPress}
          onJoinRequest={handleJoinRequest}
        />
      )}
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#7A33CC',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#7A33CC',
  },
});
