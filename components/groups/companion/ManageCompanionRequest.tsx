import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompanionRequestDto } from '@/api/backend/companionRequest/companionTypes';
import {
  acceptCompanionRequest,
  rejectCompanionRequest, 
  getCompanionRequestById,
  finishCompanionRequest,
  updateCompanionGroupId
} from '@/api/backend/companionRequest/companionRequestApi';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { useUserStore } from '@/lib/storage/useUserStorage';
import { createGroup } from '@/api/backend/group/groupApi';
import { createGroupFirebase, joinGroupChatFirebaseWithClerkId } from '@/api/firebase/chat/chatService';
import { invalidateGroupsCache } from '@/lib/hooks/useUserGroups';

interface ManageCompanionRequestProps {
  request: CompanionRequestDto;
  onClose: () => void;
  onRequestUpdated: () => void;
}

export default function ManageCompanionRequest({
  request,
  onClose,
  onRequestUpdated,
}: ManageCompanionRequestProps) {
  const [requestData, setRequestData] = useState<CompanionRequestDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);
  const { user } = useUserStore();

  useEffect(() => {
    loadRequestData();
  }, [request.id]);

  const loadRequestData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setToken(token);

      const data = await getCompanionRequestById(request.id);
      setRequestData(data);
    } catch (error) {
      console.error('Error cargando datos de la solicitud:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos de la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const canManage = requestData && requestData.companion && requestData.state === 'PENDING';

  const handleAccept = async () => {
    Alert.alert(
      'Aceptar solicitud',
      '¿Estás seguro de que quieres aceptar a este usuario como tu acompañante? Se creará automáticamente un grupo para coordinar el viaje.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: async () => {
            try {
              setProcessing(true);
              const token = await getToken();
              setToken(token);

              // Primero aceptar la solicitud
              await acceptCompanionRequest(request.id);
              console.log('Solicitud aceptada');

              // Crear grupo automáticamente
              if (requestData && requestData.companion) {
                const creatorId = user?.id || requestData.creator?.id;
                const companionId = requestData.companion.id;

                if (!creatorId || !companionId) {
                  throw new Error('IDs de usuario requeridos para crear el grupo');
                }

                const groupData = {
                  name: `Acompañamiento: ${getLocationDisplay(requestData.source)} → ${getLocationDisplay(requestData.destination)}`,
                  description: `Grupo creado para coordinar el viaje compartido. Miembros: ${user?.name || 'Tú'} y ${requestData.companion.name}`,
                  imageUrl: '',
                  type: 'COMPANION' as const,
                  ownerId: creatorId,
                  membersIds: [creatorId, companionId],
                  adminsIds: [creatorId]
                };

                console.log('Creando grupo COMPANION:', groupData);

                try {
                  // Crear grupo en backend
                  const groupId = await createGroup(groupData);
                  console.log('Grupo creado con ID:', groupId);

                  if (!requestData.companion.idClerk) {
                    throw new Error('El usuario acompañante no tiene un idClerk definido.');
                  }
                  joinGroupChatFirebaseWithClerkId(groupId.toString(), requestData.companion.idClerk);

                  // Guardar el ID del grupo en la solicitud de acompañamiento
                  await updateCompanionGroupId(request.id, groupId);
                  console.log('CompanionGroupId actualizado en la solicitud');

                  // Crear chat en Firebase
                  const chatId = await createGroupFirebase({ ...groupData, id: groupId });
                  console.log('Chat de Firebase inicializado:', chatId);

                  // Invalidar caché para actualizar listas
                  invalidateGroupsCache();

                  Alert.alert(
                    '¡Éxito!', 
                    `Has aceptado al acompañante y se ha creado el grupo "${groupData.name}". Podrás coordinar el viaje desde la pestaña de grupos.`,
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          onRequestUpdated();
                          onClose();
                        },
                      },
                    ]
                  );
                } catch (groupError) {
                  console.error('Error creando grupo:', groupError);
                  // Aunque el grupo falle, la solicitud ya fue aceptada
                  Alert.alert(
                    'Solicitud aceptada',
                    'Has aceptado al acompañante, pero hubo un problema creando el grupo automático. Puedes crear uno manualmente desde la pestaña de grupos.',
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          onRequestUpdated();
                          onClose();
                        },
                      },
                    ]
                  );
                }
              }

            } catch (error) {
              console.error('Error aceptando solicitud:', error);
              Alert.alert('Error', 'No se pudo aceptar la solicitud');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    Alert.alert(
      'Rechazar solicitud',
      '¿Estás seguro de que quieres rechazar a este usuario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              const token = await getToken();
              setToken(token);

              await rejectCompanionRequest(request.id);
              Alert.alert('Solicitud rechazada', 'Has rechazado al solicitante', [
                {
                  text: 'OK',
                  onPress: () => {
                    onRequestUpdated();
                    onClose();
                  },
                },
              ]);
            } catch (error) {
              console.error('Error rechazando solicitud:', error);
              Alert.alert('Error', 'No se pudo rechazar la solicitud');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleFinish = async () => {
    Alert.alert(
      'Finalizar solicitud',
      '¿Estás seguro de que quieres finalizar esta solicitud? No se podrán hacer más cambios.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              const token = await getToken();
              setToken(token);

              await finishCompanionRequest(request.id);
              Alert.alert('Solicitud finalizada', 'Has finalizado la solicitud', [
                {
                  text: 'OK',
                  onPress: () => {
                    onRequestUpdated();
                    onClose();
                  },
                },
              ]);
            } catch (error) {
              console.error('Error finalizando solicitud:', error);
              Alert.alert('Error', 'No se pudo finalizar la solicitud');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const getLocationDisplay = (location: any) => {
    if (!location) return 'Ubicación no disponible';
    return location.name || location.address || `${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Gestionar solicitud</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Información de la solicitud */}
        {loading ? (
          <View style={styles.requestInfoCard}>
            <ActivityIndicator size="large" color="#7A33CC" />
          </View>
        ) : requestData ? (
          <View style={styles.requestInfoCard}>
            <Text style={styles.sectionTitle}>Detalles de tu solicitud</Text>
            
            {requestData.description && (
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>{requestData.description}</Text>
              </View>
            )}

            <View style={styles.routeContainer}>
              <View style={styles.routeItem}>
                <Ionicons name="location" size={20} color="#10B981" />
                <View style={styles.routeDetails}>
                  <Text style={styles.routeLabel}>Origen</Text>
                  <Text style={styles.routeValue}>{getLocationDisplay(requestData.source)}</Text>
                </View>
              </View>

              <Ionicons name="arrow-down" size={20} color="#9CA3AF" style={styles.routeSeparator} />

              <View style={styles.routeItem}>
                <Ionicons name="location" size={20} color="#EF4444" />
                <View style={styles.routeDetails}>
                  <Text style={styles.routeLabel}>Destino</Text>
                  <Text style={styles.routeValue}>{getLocationDisplay(requestData.destination)}</Text>
                </View>
              </View>
            </View>

            {requestData.aproxHour && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>
                  {new Date(requestData.aproxHour).toLocaleString('es-ES', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Información del solicitante */}
        <View style={styles.applicantsSection}>
          <Text style={styles.sectionTitle}>
            Solicitante
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7A33CC" />
              <Text style={styles.loadingText}>Cargando información...</Text>
            </View>
          ) : !requestData || !requestData.companion ? (
            <View style={styles.emptyState}>
              <Ionicons name="person-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No hay solicitante</Text>
              <Text style={styles.emptySubtext}>
                Aún no hay nadie interesado en acompañarte
              </Text>
            </View>
          ) : (
            <View style={styles.applicantCard}>
              <View style={styles.applicantHeader}>
                {requestData.companion.image ? (
                  <Image 
                    source={{ uri: requestData.companion.image }} 
                    style={styles.applicantAvatar}
                  />
                ) : (
                  <View style={styles.applicantAvatarPlaceholder}>
                    <Ionicons name="person" size={24} color="#7A33CC" />
                  </View>
                )}
                
                <View style={styles.applicantInfo}>
                  <Text style={styles.applicantName}>{requestData.companion.name}</Text>
                  {requestData.creationDate && (
                    <Text style={styles.applicantDate}>
                      Solicitó el {new Date(requestData.creationDate).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </Text>
                  )}
                </View>
              </View>

              {requestData.companionMessage && (
                <View style={styles.messageContainer}>
                  <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
                  <Text style={styles.messageText}>{requestData.companionMessage}</Text>
                </View>
              )}

            {canManage ? (
              <View style={styles.applicantActions}>
                <Pressable
                  style={[
                    styles.rejectButton,
                    processing && styles.buttonDisabled
                  ]}
                  onPress={handleReject}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <>
                      <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                      <Text style={styles.rejectButtonText}>Rechazar</Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={[
                    styles.acceptButton,
                    processing && styles.buttonDisabled
                  ]}
                  onPress={handleAccept}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                      <Text style={styles.acceptButtonText}>Aceptar</Text>
                    </>
                  )}
                </Pressable>
              </View>
            ) : (
              <View style={styles.stateNotice}>
                <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                <Text style={styles.stateNoticeText}>
                  Esta solicitud ya no admite cambios (estado: {requestData?.state}).
                </Text>
              </View>
            )}
            </View>
          )}
        </View>

        {/* Botón de finalizar solicitud (solo para el creador) */}
        {!loading && requestData && requestData.state === 'PENDING' && (
          <View style={styles.finishSection}>
            <Pressable
              style={[
                styles.finishButton,
                processing && styles.buttonDisabled
              ]}
              onPress={handleFinish}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <Ionicons name="stop-circle-outline" size={20} color="#EF4444" />
                  <Text style={styles.finishButtonText}>Finalizar solicitud</Text>
                </>
              )}
            </Pressable>
            <Text style={styles.finishDescription}>
              Al finalizar la solicitud, ya no podrás recibir más aplicantes ni realizar cambios.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  requestInfoCard: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  routeContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  routeValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  routeSeparator: {
    alignSelf: 'center',
    marginVertical: 8,
  },
  applicantsSection: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  applicantCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  applicantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  applicantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  applicantAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applicantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  applicantDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  messageContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  applicantActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7A33CC',
    paddingVertical: 12,
    borderRadius: 8,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  stateNotice: {
  marginTop: 12,
  padding: 10,
  borderRadius: 8,
  backgroundColor: '#F3F4F6',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
stateNoticeText: {
  fontSize: 13,
  color: '#4B5563',
  flex: 1,
},
finishSection: {
  marginHorizontal: 16,
  marginTop: 16,
  padding: 16,
  backgroundColor: '#FFF',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#FEE2E2',
},
finishButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  backgroundColor: '#FEE2E2',
  paddingVertical: 12,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#EF4444',
  marginBottom: 8,
},
finishButtonText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#EF4444',
},
finishDescription: {
  fontSize: 12,
  color: '#6B7280',
  textAlign: 'center',
  lineHeight: 16,
},
});
