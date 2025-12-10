import React, { useState, useEffect } from 'react';
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
import { CompanionRequestDto, CompanionApplicant } from '@/api/backend/companionRequest/companionTypes';
import { 
  getCompanionRequestApplicants,
  acceptCompanionRequest,
  rejectCompanionRequest 
} from '@/api/backend/companionRequest/companionRequestApi';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';

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
  const [applicants, setApplicants] = useState<CompanionApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  useEffect(() => {
    loadApplicants();
  }, [request.id]);

  const loadApplicants = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setToken(token);

      const data = await getCompanionRequestApplicants(request.id);
      setApplicants(data);
    } catch (error) {
      console.error('Error cargando solicitantes:', error);
      Alert.alert('Error', 'No se pudieron cargar los solicitantes');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (userId: number) => {
    Alert.alert(
      'Aceptar solicitud',
      '¿Estás seguro de que quieres aceptar a este usuario como tu acompañante?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: async () => {
            try {
              setProcessingId(userId);
              const token = await getToken();
              setToken(token);

              await acceptCompanionRequest(request.id);
              Alert.alert('¡Éxito!', 'Has aceptado al acompañante', [
                {
                  text: 'OK',
                  onPress: () => {
                    onRequestUpdated();
                    onClose();
                  },
                },
              ]);
            } catch (error) {
              console.error('Error aceptando solicitud:', error);
              Alert.alert('Error', 'No se pudo aceptar la solicitud');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (userId: number) => {
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
              setProcessingId(userId);
              const token = await getToken();
              setToken(token);

              await rejectCompanionRequest(request.id);
              Alert.alert('Solicitud rechazada', 'Has rechazado al solicitante');
              await loadApplicants();
            } catch (error) {
              console.error('Error rechazando solicitud:', error);
              Alert.alert('Error', 'No se pudo rechazar la solicitud');
            } finally {
              setProcessingId(null);
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
        <View style={styles.requestInfoCard}>
          <Text style={styles.sectionTitle}>Detalles de tu solicitud</Text>
          
          {request.description && (
            <View style={styles.infoRow}>
              <Ionicons name="document-text-outline" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{request.description}</Text>
            </View>
          )}

          <View style={styles.routeContainer}>
            <View style={styles.routeItem}>
              <Ionicons name="location" size={20} color="#10B981" />
              <View style={styles.routeDetails}>
                <Text style={styles.routeLabel}>Origen</Text>
                <Text style={styles.routeValue}>{getLocationDisplay(request.source)}</Text>
              </View>
            </View>

            <Ionicons name="arrow-down" size={20} color="#9CA3AF" style={styles.routeSeparator} />

            <View style={styles.routeItem}>
              <Ionicons name="location" size={20} color="#EF4444" />
              <View style={styles.routeDetails}>
                <Text style={styles.routeLabel}>Destino</Text>
                <Text style={styles.routeValue}>{getLocationDisplay(request.destination)}</Text>
              </View>
            </View>
          </View>

          {request.aproxHour && (
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color="#6B7280" />
              <Text style={styles.infoText}>
                {new Date(request.aproxHour).toLocaleString('es-ES', {
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

        {/* Lista de solicitantes */}
        <View style={styles.applicantsSection}>
          <Text style={styles.sectionTitle}>
            Solicitantes ({applicants.length})
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7A33CC" />
              <Text style={styles.loadingText}>Cargando solicitantes...</Text>
            </View>
          ) : applicants.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No hay solicitantes aún</Text>
              <Text style={styles.emptySubtext}>
                Cuando alguien solicite unirse a tu viaje, aparecerá aquí
              </Text>
            </View>
          ) : (
            applicants.map((applicant) => (
              <View key={applicant.userId} style={styles.applicantCard}>
                <View style={styles.applicantHeader}>
                  {applicant.userImage ? (
                    <Image 
                      source={{ uri: applicant.userImage }} 
                      style={styles.applicantAvatar}
                    />
                  ) : (
                    <View style={styles.applicantAvatarPlaceholder}>
                      <Ionicons name="person" size={24} color="#7A33CC" />
                    </View>
                  )}
                  
                  <View style={styles.applicantInfo}>
                    <Text style={styles.applicantName}>{applicant.userName}</Text>
                    <Text style={styles.applicantDate}>
                      Solicitó: {new Date(applicant.requestDate).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>

                {applicant.companionMessage && (
                  <View style={styles.messageContainer}>
                    <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
                    <Text style={styles.messageText}>{applicant.companionMessage}</Text>
                  </View>
                )}

                <View style={styles.applicantActions}>
                  <Pressable
                    style={[
                      styles.rejectButton,
                      processingId === applicant.userId && styles.buttonDisabled
                    ]}
                    onPress={() => handleReject(applicant.userId)}
                    disabled={processingId === applicant.userId}
                  >
                    {processingId === applicant.userId ? (
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
                      processingId === applicant.userId && styles.buttonDisabled
                    ]}
                    onPress={() => handleAccept(applicant.userId)}
                    disabled={processingId === applicant.userId}
                  >
                    {processingId === applicant.userId ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                        <Text style={styles.acceptButtonText}>Aceptar</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
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
});
