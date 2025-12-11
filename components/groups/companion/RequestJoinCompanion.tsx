import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompanionRequestDto } from '@/api/backend/companionRequest/companionTypes';
import { requestToJoinCompanionRequest } from '@/api/backend/companionRequest/companionRequestApi';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';

interface RequestJoinCompanionProps {
  request: CompanionRequestDto;
  onClose: () => void;
  onRequestSent: () => void;
}

export default function RequestJoinCompanion({
  request,
  onClose,
  onRequestSent,
}: RequestJoinCompanionProps) {
  const [formData, setFormData] = useState({
    departurePoint: '', // Desde dónde sales
    departureTime: '', // A qué hora
    destinationDetail: '', // Destino específico/diferencia con creator
    trustInfo: '', // Info de confianza
  });
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  const getLocationDisplay = (location: any) => {
    if (!location) return 'Ubicación no disponible';
    return location.name || location.address || `${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}`;
  };

  const validateForm = (): boolean => {
    if (!formData.departurePoint.trim()) {
      Alert.alert('Campo requerido', 'Por favor, indica desde dónde sales');
      return false;
    }
    if (!formData.departureTime.trim()) {
      Alert.alert('Campo requerido', 'Por favor, indica a qué hora aproximada sales');
      return false;
    }
    if (!formData.destinationDetail.trim()) {
      Alert.alert('Campo requerido', 'Por favor, indica tu destino específico');
      return false;
    }
    if (!formData.trustInfo.trim()) {
      Alert.alert('Campo requerido', 'Por favor, comparte algo sobre ti que genere confianza');
      return false;
    }
    return true;
  };

  const buildCompanionMessage = (): string => {
    const parts: string[] = [];
    
    parts.push('Hola 😊');
    
    if (formData.departurePoint) {
      parts.push(`Salgo desde ${formData.departurePoint}`);
    }
    
    if (formData.departureTime) {
      parts.push(`${formData.departureTime}`);
    }
    
    if (formData.destinationDetail) {
      parts.push(`Mi destino es ${formData.destinationDetail}`);
    }
    
    if (formData.trustInfo) {
      parts.push(`${formData.trustInfo}`);
    }
    
    return parts.join('. ') + '.';
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    Alert.alert(
      'Confirmar solicitud',
      '¿Estás seguro de que quieres enviar tu solicitud para unirte a este viaje?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            try {
              setLoading(true);
              const token = await getToken();
              setToken(token);

              const companionMessage = buildCompanionMessage();
              
              // TODO: Implementar endpoint
              await requestToJoinCompanionRequest(request.id, companionMessage);
              
              Alert.alert(
                '¡Solicitud enviada!',
                'Tu solicitud ha sido enviada al creador del viaje. Te notificaremos cuando responda.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      onRequestSent();
                      onClose();
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Error enviando solicitud:', error);
              Alert.alert('Error', 'No se pudo enviar la solicitud. Inténtalo de nuevo.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle}>Solicitar acompañar</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Información del viaje */}
          <View style={styles.tripInfoCard}>
            <Text style={styles.sectionTitle}>Detalles del viaje</Text>
            
            <View style={styles.creatorInfo}>
              <Ionicons name="person-circle-outline" size={20} color="#7A33CC" />
              <Text style={styles.creatorText}>Creado por: {request.creator?.name || 'Usuario'}</Text>
            </View>

            <View style={styles.routeContainer}>
              <View style={styles.routeItem}>
                <Ionicons name="location" size={18} color="#10B981" />
                <View style={styles.routeDetails}>
                  <Text style={styles.routeLabel}>Origen</Text>
                  <Text style={styles.routeValue}>{getLocationDisplay(request.source)}</Text>
                </View>
              </View>

              <Ionicons name="arrow-down" size={18} color="#9CA3AF" style={styles.routeSeparator} />

              <View style={styles.routeItem}>
                <Ionicons name="location" size={18} color="#EF4444" />
                <View style={styles.routeDetails}>
                  <Text style={styles.routeLabel}>Destino</Text>
                  <Text style={styles.routeValue}>{getLocationDisplay(request.destination)}</Text>
                </View>
              </View>
            </View>

            {request.aproxHour && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={18} color="#6B7280" />
                <Text style={styles.infoText}>
                  {new Date(request.aproxHour).toLocaleString('es-ES', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            )}

            {request.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>Descripción:</Text>
                <Text style={styles.descriptionText}>{request.description}</Text>
              </View>
            )}
          </View>

          {/* Formulario de solicitud */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Tu solicitud</Text>
            <Text style={styles.sectionSubtitle}>
              Completa la información para que el creador pueda conocerte mejor
            </Text>

            {/* Punto de salida (requerido) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>¿Desde dónde sales?</Text>
                <Text style={styles.requiredBadge}>Requerido</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder='Ej: "la zona de Sants", "cerca de Glòries", "Hospitalet centro"'
                value={formData.departurePoint}
                onChangeText={(text) => setFormData({ ...formData, departurePoint: text })}
                maxLength={80}
              />
              <Text style={styles.characterCount}>{formData.departurePoint.length}/80</Text>
              <Text style={styles.fieldHint}>Indica tu punto de salida aproximado</Text>
            </View>

            {/* Hora de salida (requerido) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>¿A qué hora aproximada?</Text>
                <Text style={styles.requiredBadge}>Requerido</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder='Ej: "sobre las 19:00", "antes de las 22:00", "a las 18:30"'
                value={formData.departureTime}
                onChangeText={(text) => setFormData({ ...formData, departureTime: text })}
                maxLength={60}
              />
              <Text style={styles.characterCount}>{formData.departureTime.length}/60</Text>
              <Text style={styles.fieldHint}>Indica tu hora de salida flexible</Text>
            </View>

            {/* Destino específico (requerido) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Tu destino específico</Text>
                <Text style={styles.requiredBadge}>Requerido</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder='Ej: "también la UPC Nord", "cerca de Diagonal Mar", "la misma zona"'
                value={formData.destinationDetail}
                onChangeText={(text) => setFormData({ ...formData, destinationDetail: text })}
                maxLength={80}
              />
              <Text style={styles.characterCount}>{formData.destinationDetail.length}/80</Text>
              <Text style={styles.fieldHint}>
                {request.destination ? 
                  `El creador va a: ${getLocationDisplay(request.destination)}` : 
                  'Indica tu destino específico'
                }
              </Text>
            </View>

            {/* Información de confianza (requerido) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Algo sobre ti</Text>
                <Text style={styles.requiredBadge}>Requerido</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder='Ej: "Es mi primera vez con la app, pero conozco bien la zona", "Suelo ir andando rápido", "Me gusta ir hablando durante el camino"'
                value={formData.trustInfo}
                onChangeText={(text) => setFormData({ ...formData, trustInfo: text })}
                multiline
                numberOfLines={2}
                maxLength={120}
              />
              <Text style={styles.characterCount}>{formData.trustInfo.length}/120</Text>
              <Text style={styles.fieldHint}>Comparte algo que te haga confiable</Text>
            </View>

            {/* Vista previa del mensaje */}
            {(formData.departurePoint || formData.departureTime || formData.destinationDetail || formData.trustInfo) && (
              <View style={styles.previewContainer}>
                <View style={styles.previewHeader}>
                  <Ionicons name="eye-outline" size={18} color="#7A33CC" />
                  <Text style={styles.previewTitle}>Vista previa del mensaje</Text>
                </View>
                <Text style={styles.previewText}>{buildCompanionMessage()}</Text>
              </View>
            )}
          </View>

          {/* Botón de envío */}
          <View style={styles.submitButtonContainer}>
            <Pressable
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#FFF" />
                  <Text style={styles.submitButtonText}>Enviar solicitud</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  flex: {
    flex: 1,
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
  scrollContent: {
    paddingBottom: 40,
  },
  submitButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  tripInfoCard: {
    backgroundColor: '#FFF',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
  },
  creatorText: {
    fontSize: 14,
    color: '#7A33CC',
    fontWeight: '500',
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
    gap: 10,
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  routeValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  routeSeparator: {
    alignSelf: 'center',
    marginVertical: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
  },
  descriptionContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  descriptionLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  requiredBadge: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  textInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  fieldHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    fontStyle: 'italic',
  },
  previewContainer: {
    backgroundColor: '#F3E8FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7A33CC',
  },
  previewText: {
    fontSize: 12,
    color: '#6B21A8',
    lineHeight: 18,
  },
  footer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7A33CC',
    paddingVertical: 14,
    borderRadius: 10,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
