import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/lib/storage/useUserStorage';

interface VerificationBannerProps {
  onPress: () => void;
}

export default function VerificationBanner({ onPress }: VerificationBannerProps) {
  const { user } = useUserStore();

  // No mostrar si ya está verificado
  if (user?.verify) {
    return (
      <View style={styles.verifiedContainer}>
        <View style={styles.verifiedBadge}>
          <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
          <Text style={styles.verifiedText}>Perfil Verificado</Text>
        </View>
        <Text style={styles.verifiedSubtext}>
          Tu cuenta ha sido verificada. Tienes acceso completo a grupos de acompañamiento.
        </Text>
      </View>
    );
  }

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name="shield-checkmark-outline" size={32} color="#FF9800" />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Verifica tu perfil</Text>
        <Text style={styles.description}>
          Completa la verificación para acceder a grupos de acompañamiento y más funciones
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
});
