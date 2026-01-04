import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { joinGroup } from '@/api/backend/group/groupApi';
import { useUserStore } from '@/lib/storage/useUserStorage';
import { joinGroupChatFirebase } from '@/api/firebase/chat/chatService';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';

interface JoinGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (groupId?: number) => void;
}

export default function JoinGroupModal({ visible, onClose, onSuccess }: JoinGroupModalProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const { user } = useUserStore();
  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  // Función para validar el código (8 caracteres del alfabeto específico)
  const validateCode = (input: string): string => {
    // Alfabeto permitido según tu backend
    const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    
    // Convertir a mayúsculas y filtrar solo caracteres permitidos
    const filtered = input
      .toUpperCase()
      .split('')
      .filter(char => allowedChars.includes(char))
      .join('')
      .slice(0, 8); // Máximo 8 caracteres
    
    return filtered;
  };

  const handleCodeChange = (text: string) => {
    const validatedCode = validateCode(text);
    setCode(validatedCode);
  };

  const formatCode = (code: string) => {
    // Formatear como XXXX-XXXX para mejor legibilidad
    if (code.length <= 4) return code;
    return `${code.slice(0, 4)}-${code.slice(4)}`;
  };

  const handleJoinGroup = async () => {
    if (code.length !== 8) {
      Alert.alert(t('joinGroupModal.alerts.invalidCodeTitle'), t('joinGroupModal.alerts.invalidCodeMessage'));
      return;
    }

    setIsJoining(true);
    
    try {
      console.log('Joining group with code:', code);

      const token = await getToken();
      setToken(token);

      if (!user || typeof user.id !== 'number') {
        Alert.alert(t('joinGroupModal.alerts.errorTitle'), t('joinGroupModal.alerts.userMissing'));
        setIsJoining(false);
        return;
      }
      const groupId = await joinGroup(user.id, code);
      console.log("Usuario unido al grupo con ID:", groupId);

      const responseFb = await joinGroupChatFirebase(String(groupId));
      console.log("Usuario unido al chat de Firebase:", responseFb);

      // Invalidar caché de grupos
      const { invalidateGroupsCache } = require('@/lib/hooks/useUserGroups');
      invalidateGroupsCache();

      if (onSuccess) {
        onSuccess(groupId);
      } else {
        onClose();
      }
      
    } catch (error) {
      Alert.alert(t('joinGroupModal.alerts.errorTitle'), t('joinGroupModal.alerts.invalidCode'));
    } finally {
      setIsJoining(false);
    }
  };

  const handlePasteCode = async () => {
    try {
      const clipboardText = await Clipboard.getStringAsync();
      const validatedCode = validateCode(clipboardText);
      if (validatedCode.length > 0) {
        setCode(validatedCode);
      }
    } catch (error) {
      console.error('Error pasting from clipboard:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#7A33CC" />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t('joinGroupModal.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('joinGroupModal.subtitle')}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Code Input Section */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>{t('joinGroupModal.invitationCode')}</Text>
            <View style={styles.codeInputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.codeInput}
                value={formatCode(code)}
                onChangeText={handleCodeChange}
                placeholder={t('joinGroupModal.placeholder')}
                placeholderTextColor="#999"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={9}
                keyboardType="default"
                textAlign="center"
              />
              <Pressable style={styles.pasteButton} onPress={handlePasteCode}>
                <Ionicons name="clipboard" size={20} color="#7A33CC" />
                <Text style={styles.pasteText}>{t('joinGroupModal.paste')}</Text>
              </Pressable>
            </View>
            
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>{code.length}/8 {t('joinGroupModal.characters')}</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(code.length / 8) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#7A33CC" />
              <Text style={styles.infoText}>
                {t('joinGroupModal.info')}
              </Text>
            </View>

            {/* Code Format Example */}
            <View style={styles.exampleBox}>
              <Text style={styles.exampleTitle}>{t('joinGroupModal.exampleTitle')}</Text>
              <View style={styles.exampleCode}>
                <Text style={styles.exampleText}>ABCD-2E3F</Text>
              </View>
            </View>
          </View>

          {/* Troubleshooting */}
          <View style={styles.troubleshootSection}>
            <Text style={styles.troubleshootTitle}>{t('joinGroupModal.troubleshoot.title')}</Text>
            <View style={styles.troubleshootItem}>
              <Ionicons name="checkmark-circle" size={16} color="#7A33CC" />
              <Text style={styles.troubleshootText}>
                {t('joinGroupModal.troubleshoot.checkCode')}
              </Text>
            </View>
            <View style={styles.troubleshootItem}>
              <Ionicons name="checkmark-circle" size={16} color="#7A33CC" />
              <Text style={styles.troubleshootText}>
                {t('joinGroupModal.troubleshoot.checkExpired')}
              </Text>
            </View>
            <View style={styles.troubleshootItem}>
              <Ionicons name="checkmark-circle" size={16} color="#7A33CC" />
              <Text style={styles.troubleshootText}>
                {t('joinGroupModal.troubleshoot.contactAdmin')}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>{t('joinGroupModal.buttons.cancel')}</Text>
          </Pressable>
          <Pressable 
            style={[
              styles.joinButton, 
              (code.length !== 8 || isJoining) && styles.joinButtonDisabled
            ]} 
            onPress={handleJoinGroup}
            disabled={code.length !== 8 || isJoining}
          >
            {isJoining ? (
              <Text style={styles.joinButtonText}>{t('joinGroupModal.buttons.joining')}</Text>
            ) : (
              <Text style={styles.joinButtonText}>{t('joinGroupModal.buttons.join')}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  inputSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  codeInputContainer: {
    alignItems: 'center',
    width: '100%',
  },
  codeInput: {
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#FAFAFA',
    width: '80%',
    fontFamily: 'monospace',
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F4FF',
    borderRadius: 8,
    marginTop: 12,
  },
  pasteText: {
    color: '#7A33CC',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  progressContainer: {
    width: '80%',
    marginTop: 16,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7A33CC',
    borderRadius: 2,
  },
  infoSection: {
    marginTop: 40,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F4FF',
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#7A33CC',
    marginLeft: 8,
    lineHeight: 20,
  },
  exampleBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    alignItems: 'center',
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  exampleCode: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  exampleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  troubleshootSection: {
    marginTop: 32,
    marginBottom: 24,
  },
  troubleshootTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  troubleshootItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  troubleshootText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  joinButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#7A33CC',
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: '#CCC',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});