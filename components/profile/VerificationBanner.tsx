import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore, ValidationStatus } from '@/lib/storage/useUserStorage';
import { useTranslation } from 'react-i18next';

interface VerificationBannerProps {
  onPress: () => void;
}

export default function VerificationBanner({ onPress }: VerificationBannerProps) {
  const { user } = useUserStore();
  const { t } = useTranslation();

  // Mostrar banner de verificado si está VERIFIED
  if (user?.verify === ValidationStatus.VERIFIED) {
    return (
      <View style={styles.verifiedContainer}>
        <View style={styles.verifiedBadge}>
          <Ionicons name="shield-checkmark" size={20} color="#10B981" />
          <Text style={styles.verifiedText}>{t('profile.verificationBanner.verified.title')}</Text>
        </View>
        <Text style={styles.verifiedSubtext}>
          {t('profile.verificationBanner.verified.subtitle')}
        </Text>
      </View>
    );
  }

  // Mostrar banner de rechazado si está REJECTED
  if (user?.verify === ValidationStatus.REJECTED) {
    return (
      <View style={styles.rejectedContainer}>
        <View style={styles.rejectedBadge}>
          <Ionicons name="close-circle" size={20} color="#EF4444" />
          <Text style={styles.rejectedText}>{t('profile.verificationBanner.rejected.title')}</Text>
        </View>
        <Text style={styles.rejectedSubtext}>
          {t('profile.verificationBanner.rejected.subtitle')}
        </Text>
      </View>
    );
  }

  // Mostrar banner para NO_REQUEST (sin solicitud de verificación)
  if (user?.verify === ValidationStatus.NO_REQUEST) {
    return (
      <Pressable style={styles.noRequestContainer} onPress={onPress}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-outline" size={32} color="#6B7280" />
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title}>
            {t('profile.verificationBanner.noRequest.title')}
          </Text>
          <Text style={styles.description}>
            {t('profile.verificationBanner.noRequest.description')}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
      </Pressable>
    );
  }

  // Mostrar banner de pendiente o no verificado (PENDING o null)
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name="shield-checkmark-outline" size={32} color="#FF9800" />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>
          {user?.verify === ValidationStatus.PENDING 
            ? t('profile.verificationBanner.pending.title')
            : t('profile.verificationBanner.notVerified.title')}
        </Text>
        <Text style={styles.description}>
          {user?.verify === ValidationStatus.PENDING
            ? t('profile.verificationBanner.pending.description')
            : t('profile.verificationBanner.notVerified.description')}
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
  noRequestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
