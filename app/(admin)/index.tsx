import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';

// Mock data de solicitudes de verificación pendientes
const mockVerificationRequests: VerificationRequest[] = [
  {
    id: '1',
    userId: 101,
    userName: 'Ana García',
    email: 'ana.garcia@example.com',
    profileImage: null,
    livePhoto: null,
    requestDate: '2025-11-18T10:30:00',
    status: 'pending',
  },
  {
    id: '2',
    userId: 102,
    userName: 'Carlos Martínez',
    email: 'carlos.m@example.com',
    profileImage: null,
    livePhoto: null,
    requestDate: '2025-11-18T14:20:00',
    status: 'pending',
  },
  {
    id: '3',
    userId: 103,
    userName: 'María López',
    email: 'maria.lopez@example.com',
    profileImage: null,
    livePhoto: null,
    requestDate: '2025-11-19T09:15:00',
    status: 'pending',
  },
  {
    id: '4',
    userId: 104,
    userName: 'Pedro Sánchez',
    email: 'pedro.s@example.com',
    profileImage: null,
    livePhoto: null,
    requestDate: '2025-11-19T11:45:00',
    status: 'pending',
  },
];

type VerificationStatus = 'pending' | 'approved' | 'rejected';

interface VerificationRequest {
  id: string;
  userId: number;
  userName: string;
  email: string;
  profileImage: string | null;
  livePhoto: string | null;
  requestDate: string;
  status: VerificationStatus;
}

export default function AdminVerificationScreen() {
  const { signOut } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>(mockVerificationRequests);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const handleSignOut = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)');
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión. Inténtalo de nuevo.');
            }
          },
        },
      ]
    );
  };

  const handleViewDetails = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleApprove = (requestId: string) => {
    Alert.alert(
      'Aprobar verificación',
      '¿Estás seguro de que quieres aprobar esta verificación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          style: 'default',
          onPress: () => {
            setRequests(prev =>
              prev.map(req =>
                req.id === requestId ? { ...req, status: 'approved' as VerificationStatus } : req
              )
            );
            setShowDetailModal(false);
            Alert.alert('✅ Aprobado', 'La verificación ha sido aprobada exitosamente');
          },
        },
      ]
    );
  };

  const handleReject = (requestId: string) => {
    Alert.alert(
      'Rechazar verificación',
      '¿Estás seguro de que quieres rechazar esta verificación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: () => {
            setRequests(prev =>
              prev.map(req =>
                req.id === requestId ? { ...req, status: 'rejected' as VerificationStatus } : req
              )
            );
            setShowDetailModal(false);
            Alert.alert('❌ Rechazado', 'La verificación ha sido rechazada');
          },
        },
      ]
    );
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      default:
        return '#F59E0B';
    }
  };

  const getStatusText = (status: VerificationStatus) => {
    switch (status) {
      case 'approved':
        return 'Aprobado';
      case 'rejected':
        return 'Rechazado';
      default:
        return 'Pendiente';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Panel de Administración</Text>
          <Text style={styles.headerSubtitle}>Verificación de perfiles</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingCount}</Text>
          </View>
          <Pressable style={styles.logoutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          </Pressable>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={24} color="#F59E0B" />
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
          <Text style={styles.statNumber}>{approvedCount}</Text>
          <Text style={styles.statLabel}>Aprobadas</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="close-circle-outline" size={24} color="#EF4444" />
          <Text style={styles.statNumber}>{rejectedCount}</Text>
          <Text style={styles.statLabel}>Rechazadas</Text>
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        <Pressable
          style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Todas ({requests.length})
          </Text>
        </Pressable>
        
        <Pressable
          style={[styles.filterBtn, filter === 'pending' && styles.filterBtnActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            Pendientes ({pendingCount})
          </Text>
        </Pressable>
        
        <Pressable
          style={[styles.filterBtn, filter === 'approved' && styles.filterBtnActive]}
          onPress={() => setFilter('approved')}
        >
          <Text style={[styles.filterText, filter === 'approved' && styles.filterTextActive]}>
            Aprobadas ({approvedCount})
          </Text>
        </Pressable>
        
        <Pressable
          style={[styles.filterBtn, filter === 'rejected' && styles.filterBtnActive]}
          onPress={() => setFilter('rejected')}
        >
          <Text style={[styles.filterText, filter === 'rejected' && styles.filterTextActive]}>
            Rechazadas ({rejectedCount})
          </Text>
        </Pressable>
      </ScrollView>

      {/* Lista de solicitudes */}
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <Pressable
            style={styles.requestCard}
            onPress={() => handleViewDetails(item)}
          >
            <View style={styles.requestHeader}>
              <View style={styles.userSection}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={24} color="#7A33CC" />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.userName}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                </View>
              </View>
              
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {getStatusText(item.status)}
                </Text>
              </View>
            </View>

            <View style={styles.requestFooter}>
              <View style={styles.dateInfo}>
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text style={styles.dateText}>{formatDate(item.requestDate)}</Text>
              </View>
              
              {item.status === 'pending' && (
                <View style={styles.actionButtons}>
                  <Pressable
                    style={styles.rejectBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleReject(item.id);
                    }}
                  >
                    <Ionicons name="close" size={16} color="#EF4444" />
                  </Pressable>
                  
                  <Pressable
                    style={styles.approveBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleApprove(item.id);
                    }}
                  >
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                  </Pressable>
                </View>
              )}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              No hay solicitudes {filter !== 'all' && filter !== undefined ? getStatusText(filter).toLowerCase() : ''}
            </Text>
          </View>
        }
      />

      {/* Modal de detalles */}
      {selectedRequest && (
        <Modal
          visible={showDetailModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowDetailModal(false)}
        >
          <SafeAreaView style={styles.modalContainer} edges={['top']}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={28} color="#1F2937" />
              </Pressable>
              <Text style={styles.modalTitle}>Detalles de verificación</Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Info del usuario */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Información del usuario</Text>
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Nombre:</Text>
                    <Text style={styles.detailValue}>{selectedRequest.userName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{selectedRequest.email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>ID Usuario:</Text>
                    <Text style={styles.detailValue}>{selectedRequest.userId}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fecha solicitud:</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedRequest.requestDate)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Estado:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedRequest.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(selectedRequest.status) }]}>
                        {getStatusText(selectedRequest.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Fotos de verificación */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Fotos de verificación</Text>
                <View style={styles.photosContainer}>
                  <View style={styles.photoBox}>
                    <Text style={styles.photoLabel}>Foto de perfil</Text>
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="image" size={48} color="#9CA3AF" />
                      <Text style={styles.photoPlaceholderText}>Mock: Foto de perfil</Text>
                    </View>
                  </View>
                  
                  <View style={styles.photoBox}>
                    <Text style={styles.photoLabel}>Selfie en vivo</Text>
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="camera" size={48} color="#9CA3AF" />
                      <Text style={styles.photoPlaceholderText}>Mock: Selfie</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Acciones */}
              {selectedRequest.status === 'pending' && (
                <View style={styles.actionsSection}>
                  <Pressable
                    style={styles.approveButton}
                    onPress={() => handleApprove(selectedRequest.id)}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    <Text style={styles.approveButtonText}>Aprobar verificación</Text>
                  </Pressable>
                  
                  <Pressable
                    style={styles.rejectButton}
                    onPress={() => handleReject(selectedRequest.id)}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                    <Text style={styles.rejectButtonText}>Rechazar verificación</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    backgroundColor: '#7A33CC',
    borderRadius: 12,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  
  // Filters
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterBtnActive: {
    backgroundColor: '#7A33CC',
    borderColor: '#7A33CC',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFF',
  },
  
  // Lista
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  requestCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B98120',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF444420',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  photosContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  photoBox: {
    flex: 1,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  photoPlaceholder: {
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionsSection: {
    gap: 12,
    marginBottom: 24,
  },
  approveButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  approveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  rejectButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
