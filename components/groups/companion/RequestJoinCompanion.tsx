import { useState } from 'react';
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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
    if (!location) return t('companion.request.locationUnavailable');
    return location.name || location.address || `${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}`;
  };

  const validateForm = (): boolean => {
    if (!formData.departurePoint.trim()) {
      Alert.alert(
        t('companion.request.validation.departurePoint.title'),
        t('companion.request.validation.departurePoint.message')
      );
      return false;
    }
    if (!formData.departureTime.trim()) {
      Alert.alert(
        t('companion.request.validation.departureTime.title'),
        t('companion.request.validation.departureTime.message')
      );
      return false;
    }
    if (!formData.destinationDetail.trim()) {
      Alert.alert(
        t('companion.request.validation.destinationDetail.title'),
        t('companion.request.validation.destinationDetail.message')
      );
      return false;
    }
    if (!formData.trustInfo.trim()) {
      Alert.alert(
        t('companion.request.validation.trustInfo.title'),
        t('companion.request.validation.trustInfo.message')
      );
      return false;
    }
    return true;
  };

  const buildCompanionMessage = (): string => {
    const parts: string[] = [];
    
    parts.push(t('companion.request.preview.greeting'));
    
    if (formData.departurePoint) {
      parts.push(t('companion.request.preview.from', { point: formData.departurePoint }));
    }
    
    if (formData.departureTime) {
      parts.push(t('companion.request.preview.time', { time: formData.departureTime }));
    }
    
    if (formData.destinationDetail) {
      parts.push(t('companion.request.preview.destination', { destination: formData.destinationDetail }));
    }
    
    if (formData.trustInfo) {
      parts.push(t('companion.request.preview.info', { info: formData.trustInfo }));
    }
    
    return parts.join('. ') + '.';
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    Alert.alert(
      t('companion.request.confirm.title'),
      t('companion.request.confirm.message'),
      [
        { text: t('companion.request.confirm.cancel'), style: 'cancel' },
        {
          text: t('companion.request.confirm.send'),
          onPress: async () => {
            try {
              setLoading(true);
              const token = await getToken();
              setToken(token);

              const companionMessage = buildCompanionMessage();
              
              await requestToJoinCompanionRequest(request.id, companionMessage);
              
              Alert.alert(
                t('companion.request.success.title'),
                t('companion.request.success.message'),
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
              Alert.alert(
                t('companion.request.error.title'),
                t('companion.request.error.message')
              );
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
        <Text style={styles.headerTitle}>{t('companion.request.title')}</Text>
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
            <Text style={styles.sectionTitle}>{t('companion.request.tripDetails')}</Text>
            
            <View style={styles.creatorInfo}>
              <Ionicons name="person-circle-outline" size={20} color="#7A33CC" />
              <Text style={styles.creatorText}>
                {t('companion.request.createdBy', { name: request.creator?.name || 'Usuario' })}
              </Text>
            </View>

            <View style={styles.routeContainer}>
              <View style={styles.routeItem}>
                <Ionicons name="location" size={18} color="#10B981" />
                <View style={styles.routeDetails}>
                  <Text style={styles.routeLabel}>{t('companion.request.from')}</Text>
                  <Text style={styles.routeValue}>{getLocationDisplay(request.source)}</Text>
                </View>
              </View>

              <Ionicons name="arrow-down" size={18} color="#9CA3AF" style={styles.routeSeparator} />

              <View style={styles.routeItem}>
                <Ionicons name="location" size={18} color="#EF4444" />
                <View style={styles.routeDetails}>
                  <Text style={styles.routeLabel}>{t('companion.request.to')}</Text>
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
                <Text style={styles.descriptionLabel}>{t('companion.manage.description')}:</Text>
                <Text style={styles.descriptionText}>{request.description}</Text>
              </View>
            )}
          </View>

          {/* Formulario de solicitud */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>{t('companion.request.yourRequest')}</Text>
            <Text style={styles.sectionSubtitle}>
              {t('companion.request.subtitle')}
            </Text>

            {/* Punto de salida (requerido) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>{t('companion.request.departurePoint.label')}</Text>
                <Text style={styles.requiredBadge}>{t('companion.request.departurePoint.required')}</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder={t('companion.request.departurePoint.placeholder')}
                value={formData.departurePoint}
                onChangeText={(text) => setFormData({ ...formData, departurePoint: text })}
                maxLength={80}
              />
              <Text style={styles.characterCount}>
                {t('companion.request.characterCount', { current: formData.departurePoint.length, max: 80 })}
              </Text>
            </View>

            {/* Hora de salida (requerido) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>{t('companion.request.departureTime.label')}</Text>
                <Text style={styles.requiredBadge}>{t('companion.request.departureTime.required')}</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder={t('companion.request.departureTime.placeholder')}
                value={formData.departureTime}
                onChangeText={(text) => setFormData({ ...formData, departureTime: text })}
                maxLength={60}
              />
              <Text style={styles.characterCount}>
                {t('companion.request.characterCount', { current: formData.departureTime.length, max: 60 })}
              </Text>
            </View>

            {/* Destino específico (requerido) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>{t('companion.request.destinationDetail.label')}</Text>
                <Text style={styles.requiredBadge}>{t('companion.request.destinationDetail.required')}</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder={t('companion.request.destinationDetail.placeholder')}
                value={formData.destinationDetail}
                onChangeText={(text) => setFormData({ ...formData, destinationDetail: text })}
                maxLength={80}
              />
              <Text style={styles.characterCount}>
                {t('companion.request.characterCount', { current: formData.destinationDetail.length, max: 80 })}
              </Text>
              <Text style={styles.fieldHint}>
                {t('companion.request.destinationDetail.hint')}
              </Text>
            </View>

            {/* Información de confianza (requerido) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>{t('companion.request.trustInfo.label')}</Text>
                <Text style={styles.requiredBadge}>{t('companion.request.trustInfo.required')}</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder={t('companion.request.trustInfo.placeholder')}
                value={formData.trustInfo}
                onChangeText={(text) => setFormData({ ...formData, trustInfo: text })}
                multiline
                numberOfLines={2}
                maxLength={120}
              />
              <Text style={styles.characterCount}>
                {t('companion.request.characterCount', { current: formData.trustInfo.length, max: 120 })}
              </Text>
              <Text style={styles.fieldHint}>{t('companion.request.trustInfo.hint')}</Text>
            </View>

            {/* Vista previa del mensaje */}
            {(formData.departurePoint || formData.departureTime || formData.destinationDetail || formData.trustInfo) && (
              <View style={styles.previewContainer}>
                <View style={styles.previewHeader}>
                  <Ionicons name="eye-outline" size={18} color="#7A33CC" />
                  <Text style={styles.previewTitle}>{t('companion.request.preview.title')}</Text>
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
                  <Text style={styles.submitButtonText}>{t('companion.request.send')}</Text>
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
