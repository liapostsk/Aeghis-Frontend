import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore, ValidationStatus } from '@/lib/storage/useUserStorage';

interface VerificationBannerProps {
  onPress: () => void;
}

export default function VerificationBanner({ onPress }: VerificationBannerProps) {
  const { user } = useUserStore();

  // ✅ Mostrar banner de verificado si está VERIFIED
  if (user?.verify === ValidationStatus.VERIFIED) {
    return (
      <View style={styles.verifiedContainer}>
        <View style={styles.verifiedBadge}>
          <Ionicons name="shield-checkmark" size={20} color="#10B981" />
          <Text style={styles.verifiedText}>Perfil Verificado</Text>
        </View>
        <Text style={styles.verifiedSubtext}>
          Tu cuenta ha sido verificada. Tienes acceso completo a grupos de acompañamiento.
        </Text>
      </View>
    );
  }

  // ✅ Mostrar banner de rechazado si está REJECTED
  if (user?.verify === ValidationStatus.REJECTED) {
    return (
      <View style={styles.rejectedContainer}>
        <View style={styles.rejectedBadge}>
          <Ionicons name="close-circle" size={20} color="#EF4444" />
          <Text style={styles.rejectedText}>Verificación Rechazada</Text>
        </View>
        <Text style={styles.rejectedSubtext}>
          Tu solicitud de verificación fue rechazada. Por favor, contacta con soporte.
        </Text>
      </View>
    );
  }

  // ✅ Mostrar banner de pendiente o no verificado (PENDING o null)
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name="shield-checkmark-outline" size={32} color="#FF9800" />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>
          {user?.verify === ValidationStatus.PENDING 
            ? 'Verificación en proceso' 
            : 'Verifica tu perfil'}
        </Text>
        <Text style={styles.description}>
          {user?.verify === ValidationStatus.PENDING
            ? 'Tu solicitud está siendo revisada. Te notificaremos cuando esté lista.'
            : 'Completa la verificación para acceder a grupos de acompañamiento y más funciones'}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF3CD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  verifiedContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  verifiedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803D',
  },
  verifiedSubtext: {
    fontSize: 13,
    color: '#16A34A',
    lineHeight: 18,
  },
  rejectedContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rejectedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991B1B',
  },
  rejectedSubtext: {
    fontSize: 13,
    color: '#DC2626',
    lineHeight: 18,
  },
});
