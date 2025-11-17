import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useUserStore } from '@/lib/storage/useUserStorage';
import ProfileVerificationScreen from '@/components/profile/ProfileVerificationScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VERIFICATION_SKIPPED_KEY = 'companion_verification_skipped';

const companionGroups = [
  {
    id: '1',
    initials: 'CR',
    name: 'Car ride to airport',
    date: 'Today 18:30',
    origin: 'Barcelona',
    destination: 'El Prat',
    seats: 2,
    verified: true,
  },
  {
    id: '2',
    initials: 'MV',
    name: 'Morning walk group',
    date: 'Tomorrow 07:00',
    origin: 'Diagonal',
    destination: 'Parc de la Ciutadella',
    seats: 3,
    verified: true,
  },
];

export default function CompanionsGroups() {
  const { user } = useUserStore();
  const [showVerification, setShowVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      // Verificar si el usuario ya está verificado
      const isVerified = user?.verify || false;
      
      // Verificar si el usuario saltó la verificación anteriormente
      const hasSkipped = await AsyncStorage.getItem(VERIFICATION_SKIPPED_KEY);
      
      // Mostrar verificación si:
      // 1. No está verificado Y
      // 2. No ha saltado la verificación anteriormente
      setShowVerification(!isVerified && !hasSkipped);
    } catch (error) {
      console.error('Error checking verification status:', error);
      setShowVerification(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationComplete = () => {
    setShowVerification(false);
    // Aquí podrías actualizar el estado del usuario en el backend
  };

  const handleSkipVerification = async () => {
    try {
      // Guardar que el usuario saltó la verificación
      await AsyncStorage.setItem(VERIFICATION_SKIPPED_KEY, 'true');
      setShowVerification(false);
    } catch (error) {
      console.error('Error saving skip status:', error);
    }
  };

  // Mostrar pantalla de verificación si es necesario
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (showVerification) {
    return (
      <ProfileVerificationScreen
        onVerificationComplete={handleVerificationComplete}
        onSkip={handleSkipVerification}
      />
    );
  }

  console.log('Rendering CompanionGroups');
  return (
    <View style={styles.container}>
      <FlatList
        data={companionGroups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.initials}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.groupName}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.date} · {item.origin} ➜ {item.destination}
              </Text>
              <Text style={styles.seats}>Available seats: {item.seats}</Text>
            </View>
            <Text style={styles.verifiedBadge}>🔒</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Only verified users can create or join these groups.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e2d4f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontWeight: 'bold',
    color: '#333',
  },
  info: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  meta: {
    fontSize: 13,
    color: '#666',
  },
  seats: {
    fontSize: 13,
    color: '#333',
    marginTop: 2,
  },
  verifiedBadge: {
    fontSize: 18,
    color: '#7A33CC',
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
    marginTop: 30,
  },
  loadingText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 50,
  },
});
