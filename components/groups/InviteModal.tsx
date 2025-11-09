import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { createInvitation } from '@/api/backend/group/invitationApi';

interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: number;
}

export default function InviteModal({ visible, onClose, groupId }: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  
  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  const toggleQRView = () => {
    setShowQR(!showQR);
  };

  const handleClose = () => {
    setCopied(false);
    setInviteCode(null);
    setError(null);
    setShowQR(false);
    onClose();
  };

  const generateInvitation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getToken();
      setToken(token);

      const data = await createInvitation(groupId);
      setInviteCode(data.code);
    } catch (err) {
      console.error('Error generando invitación:', err);
      setError('No se pudo generar la invitación');
    } finally {
      setLoading(false);
    }
  };

  // Generar invitación cuando se abre el modal
  useEffect(() => {
    if (visible && !inviteCode && !loading) {
      generateInvitation();
    }
  }, [visible]);

  const handleCopyCode = async () => {
    if (!inviteCode) {
      Alert.alert('Error', 'No hay código para copiar');
      return;
    }

    try {
      await Clipboard.setStringAsync(inviteCode);
      setCopied(true);
      
      // Mostrar feedback visual por 2 segundos
      setTimeout(() => {
        setCopied(false);
      }, 2000);
      
      // Feedback discreto - puedes comentar esta línea si no quieres el alert
      // Alert.alert('¡Copiado!', 'Código copiado al portapapeles');
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
      Alert.alert('Error', 'No se pudo copiar el código');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={handleClose}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Invitación generada</Text>
            <View style={styles.modalSpacer} />
          </View>

          <View style={styles.modalContent}>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7A33CC" />
                <Text style={styles.loadingText}>Generando invitación...</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
                <Pressable 
                  style={styles.retryButton} 
                  onPress={generateInvitation}
                >
                  <Ionicons name="refresh" size={16} color="#FFFFFF" />
                  <Text style={styles.retryButtonText}>Reintentar</Text>
                </Pressable>
              </View>
            )}

            {inviteCode && !loading && !error && (
              <>
                <View style={styles.inviteCodeCard}>
                  <Text style={styles.inviteCodeLabel}>Código de invitación</Text>
                  
                  {/* Vista QR o texto según el estado */}
                  {showQR ? (
                    <View style={styles.qrContainer}>
                      <QRCode
                        value={inviteCode}
                        size={200}
                        color="#7A33CC"
                        backgroundColor="#F3E8FF"
                      />
                    </View>
                  ) : (
                    <Text style={styles.inviteCodeText}>{inviteCode}</Text>
                  )}

                  {/* Fila de botones */}
                  <View style={styles.buttonRow}>
                    <Pressable 
                      style={[styles.copyButton, copied && styles.copyButtonSuccess]} 
                      onPress={handleCopyCode}
                      disabled={copied}
                    >
                      <Ionicons 
                        name={copied ? "checkmark" : "copy"} 
                        size={16} 
                        color="#FFFFFF" 
                      />
                      <Text style={styles.copyButtonText}>
                        {copied ? 'Copiado!' : 'Copiar'}
                      </Text>
                    </Pressable>

                    <Pressable 
                      style={styles.toggleButton}
                      onPress={toggleQRView}
                    >
                      <Ionicons 
                        name={showQR ? "text-outline" : "qr-code-outline"} 
                        size={16} 
                        color="#7A33CC" 
                      />
                      <Text style={styles.toggleButtonText}>
                        {showQR ? 'Ver código' : 'Ver QR'}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <Text style={styles.inviteInfo}>
                  {showQR 
                    ? 'Escanea este código QR para unirse al grupo'
                    : 'Comparte este código para que otros miembros se unan al grupo'
                  }
                </Text>
              </>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: { 
    flex: 0.85, 
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 'auto',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseText: { 
    fontSize: 14, 
    color: '#7A33CC', 
    fontWeight: '600' 
  },
  modalTitle: { 
    flex: 1, 
    textAlign: 'center', 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#1F2937' 
  },
  modalSpacer: { width: 50 },
  modalContent: { 
    flex: 1, 
    paddingHorizontal: 16, 
    paddingTop: 24 
  },
  
  // Invite Code styles
  inviteCodeCard: {
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#7A33CC',
  },
  inviteCodeLabel: { 
    fontSize: 12, 
    color: '#7A33CC', 
    fontWeight: '600', 
    marginBottom: 12 
  },
  inviteCodeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#7A33CC',
    letterSpacing: 2,
    marginBottom: 16,
  },
  copyButton: {
    backgroundColor: '#7A33CC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  copyButtonSuccess: {
    backgroundColor: '#22C55E', // Verde cuando se ha copiado
  },
  copyButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '600', 
    fontSize: 14 
  },
  inviteInfo: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Loading styles
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#7A33CC',
    marginTop: 16,
    fontWeight: '500',
  },

  // Error styles
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#7A33CC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // QR Code styles
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  toggleButton: {
    backgroundColor: '#F3E8FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7A33CC',
  },
  toggleButtonText: {
    color: '#7A33CC',
    fontWeight: '600',
    fontSize: 14,
  },
});