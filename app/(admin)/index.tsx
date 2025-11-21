import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { getUsersPendingVerification, updateUserVerificationStatus } from '@/api/backend/verification/verificationApi';
import { getVerificationPhotos } from '@/api/firebase/storage/photoService';
import { UserDto } from '@/api/backend/types';
import { ValidationStatus } from '@/lib/storage/useUserStorage';

interface UserWithPhotos extends UserDto {
  selfieUrl?: string;
  documentUrl?: string;
  photosLoaded?: boolean;
}

export default function AdminVerificationScreen() {
  const { signOut } = useAuth();
  const [users, setUsers] = useState<UserWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithPhotos | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      
      const pendingUsers = await getUsersPendingVerification();
      console.log(`📋 ${pendingUsers.length} usuarios pendientes de verificación`);

      const usersWithPhotos = await Promise.all(
        pendingUsers.map(async (user) => {
          try {
            if (!user.clerkId) {
              console.warn(`⚠️ Usuario ${user.name} no tiene clerkId`);
              return { ...user, photosLoaded: false };
            }

            const photos = await getVerificationPhotos(user.clerkId);
            
            if (photos) {
              return {
                ...user,
                selfieUrl: photos.selfieUrl,
                documentUrl: photos.documentUrl,
                photosLoaded: true,
              };
            } else {
              console.warn(`⚠️ Usuario ${user.name} no tiene fotos de verificación`);
              return {
                ...user,
                photosLoaded: false,
              };
            }
          } catch (error) {
            console.error(`❌ Error cargando fotos de ${user.name}:`, error);
            return {
              ...user,
              photosLoaded: false,
            };
          }
        })
      );

      const usersWithBothPhotos = usersWithPhotos.filter(u => u.photosLoaded);
      console.log(`✅ ${usersWithBothPhotos.length} usuarios con fotos completas`);

      setUsers(usersWithBothPhotos);
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios pendientes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (user: UserWithPhotos) => {
    Alert.alert(
      'Aprobar Verificación',
      `¿Estás seguro de que quieres aprobar a ${user.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          onPress: async () => {
            setProcessing(true);
            try {
              await updateUserVerificationStatus(user.id, ValidationStatus.VERIFIED);
              Alert.alert('✅ Aprobado', `${user.name} ha sido verificado correctamente`);
              loadPendingUsers();
              setModalVisible(false);
            } catch (error) {
              Alert.alert('Error', 'No se pudo aprobar la verificación');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (user: UserWithPhotos) => {
    Alert.alert(
      'Rechazar Verificación',
      `¿Estás seguro de que quieres rechazar a ${user.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              await updateUserVerificationStatus(user.id, ValidationStatus.REJECTED);
              Alert.alert('❌ Rechazado', `La verificación de ${user.name} ha sido rechazada`);
              loadPendingUsers();
              setModalVisible(false);
            } catch (error) {
              Alert.alert('Error', 'No se pudo rechazar la verificación');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)');
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          },
        },
      ]
    );
  };

  const renderUser = ({ item }: { item: UserWithPhotos }) => (
    <Pressable
      style={styles.card}
      onPress={() => {
        setSelectedUser(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Image 
            source={{ uri: item.image || 'https://via.placeholder.com/50' }} 
            style={styles.avatar}
          />
          <View>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
        </View>
        <View style={styles.badge}>
          <Ionicons name="time" size={16} color="#F59E0B" />
          <Text style={styles.badgeText}>PENDIENTE</Text>
        </View>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando verificaciones...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Panel de Administrador</Text>
          <Text style={styles.subtitle}>Verificaciones Pendientes</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingCount}>{users.length}</Text>
          </View>
          <Pressable style={styles.logoutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </Pressable>
        </View>
      </View>

      {users.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No hay verificaciones pendientes</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Revisar Verificación</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </Pressable>
              </View>

              {selectedUser && (
                <>
                  <View style={styles.modalUserInfo}>
                    <Image 
                      source={{ uri: selectedUser.image || 'https://via.placeholder.com/60' }} 
                      style={styles.modalAvatar}
                    />
                    <View>
                      <Text style={styles.modalUserName}>{selectedUser.name}</Text>
                      <Text style={styles.modalUserEmail}>{selectedUser.email}</Text>
                    </View>
                  </View>

                  <View style={styles.photoSection}>
                    <Text style={styles.photoLabel}>📸 Selfie</Text>
                    {selectedUser.selfieUrl ? (
                      <Image 
                        source={{ uri: selectedUser.selfieUrl }} 
                        style={styles.modalPhoto} 
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.noPhoto}>
                        <Ionicons name="image-outline" size={40} color="#D1D5DB" />
                        <Text style={styles.noPhotoText}>No disponible</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.photoSection}>
                    <Text style={styles.photoLabel}>🪪 Documento</Text>
                    {selectedUser.documentUrl ? (
                      <Image 
                        source={{ uri: selectedUser.documentUrl }} 
                        style={styles.modalPhoto} 
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.noPhoto}>
                        <Ionicons name="image-outline" size={40} color="#D1D5DB" />
                        <Text style={styles.noPhotoText}>No disponible</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.modalActions}>
                    <Pressable
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleReject(selectedUser)}
                      disabled={processing}
                    >
                      {processing ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <>
                          <Ionicons name="close-circle" size={20} color="#FFF" />
                          <Text style={styles.actionButtonText}>Rechazar</Text>
                        </>
                      )}
                    </Pressable>

                    <Pressable
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleApprove(selectedUser)}
                      disabled={processing}
                    >
                      {processing ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                          <Text style={styles.actionButtonText}>Aprobar</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
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
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pendingCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 20,
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  modalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E7EB',
  },
  modalUserName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalUserEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  photoSection: {
    marginBottom: 20,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalPhoto: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  noPhoto: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotoText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
