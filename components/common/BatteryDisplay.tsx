import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  updateUserBatteryLevel,
  getCurrentUserBatteryLevel,
  getMultipleUsersBatteryInfo
} from '@/api/firebase/users/userService';
import { useBatteryLevel } from '@/lib/hooks/useBatteryLevel';

interface BatteryDisplayProps {
  userId?: number | string;
  showControls?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function BatteryDisplay({ 
  userId, 
  showControls = true, 
  autoRefresh = false,
  refreshInterval = 60000 // 1 minuto
}: BatteryDisplayProps) {
  // Usar el hook useBatteryLevel para obtener datos reales del dispositivo
  const {
    level: batteryLevel,
    isCharging,
    isLoading,
    error,
    lastUpdated,
    refreshBatteryLevel,
    syncWithFirebase
  } = useBatteryLevel({
    updateInterval: autoRefresh ? refreshInterval : 0,
    autoSync: autoRefresh,
    silentUpdate: false
  });

  // Actualizar batería con el nivel real del dispositivo
  const updateBatteryFromDevice = async () => {
    try {
      // Refrescar el nivel de batería del dispositivo
      const level = await refreshBatteryLevel();
      
      if (level !== null) {
        // Sincronizar con Firebase
        await syncWithFirebase(level);
        Alert.alert(
          'Éxito', 
          `Nivel de batería actualizado: ${level}%${isCharging ? ' (Cargando)' : ''}`
        );
      } else {
        // Si no se pudo obtener, intentar usar el último valor conocido
        if (batteryLevel !== null) {
          await syncWithFirebase(batteryLevel);
          Alert.alert(
            'Advertencia', 
            `Usando último nivel conocido: ${batteryLevel}%\nNo se pudo obtener nivel actual del dispositivo`
          );
        } else {
          Alert.alert(
            'Error', 
            'No se pudo obtener el nivel de batería del dispositivo'
          );
        }
      }
    } catch (error) {
      console.error('Error updating battery level:', error);
      
      // Intentar guardar el último nivel conocido como fallback
      if (batteryLevel !== null) {
        try {
          await syncWithFirebase(batteryLevel);
          Alert.alert(
            'Guardado parcial', 
            `Se guardó el último nivel conocido: ${batteryLevel}%`
          );
        } catch (syncError) {
          Alert.alert('Error', 'No se pudo sincronizar con Firebase');
        }
      } else {
        Alert.alert('Error', 'No hay nivel de batería disponible para guardar');
      }
    }
  };

  // Obtener el ícono según el nivel de batería y estado de carga
  const getBatteryIcon = (level: number | null, charging: boolean | null = false) => {
    if (level === null) return 'battery-dead-outline';
    if (charging) return 'battery-charging';
    if (level <= 20) return 'battery-dead';
    if (level <= 40) return 'battery-half';
    if (level <= 80) return 'battery-half';
    return 'battery-full';
  };

  // Obtener el color según el nivel de batería
  const getBatteryColor = (level: number | null) => {
    if (level === null) return '#9CA3AF';
    if (level <= 20) return '#EF4444';
    if (level <= 40) return '#F59E0B';
    if (level <= 80) return '#10B981';
    return '#22C55E';
  };

  // Formatear la fecha de última actualización
  const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'Nunca';
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.batteryContainer}>
        <Ionicons 
          name={getBatteryIcon(batteryLevel, isCharging) as any}
          size={20} 
          color={getBatteryColor(batteryLevel)} 
        />
        <Text style={[styles.batteryText, { color: getBatteryColor(batteryLevel) }]}>
          {isLoading ? '...' : batteryLevel !== null ? `${batteryLevel}%` : 'N/A'}
          {isCharging && batteryLevel !== null ? ' ⚡' : ''}
        </Text>
      </View>
      
      {showControls && (
        <View style={styles.controls}>
          <Pressable 
            onPress={updateBatteryFromDevice} 
            style={styles.button}
            disabled={isLoading}
          >
            <Text style={styles.refreshButtonText}>
              {isLoading ? 'Actualizando...' : 'Actualizar'}
            </Text>
          </Pressable>
        </View>
      )}
      
      {error ? (
        <Text style={[styles.lastUpdated, { color: '#EF4444' }]}>
          Error: {error}
        </Text>
      ) : lastUpdated ? (
        <Text style={styles.lastUpdated}>
          Actualizado: {formatLastUpdated(lastUpdated)}
        </Text>
      ) : null}
    </View>
  );
}

// Lista detallada de participantes con información completa
export function ParticipantsList({ 
  participants, 
  autoRefresh = true, 
  refreshInterval = 30000 
}: { 
  participants: Array<{
    id: string | number;
    name: string;
    email?: string;
    phone?: string;
  }>;
  autoRefresh?: boolean;
  refreshInterval?: number;
}) {
  const [participantsData, setParticipantsData] = useState<Array<{
    user: {
      id: string | number;
      name: string;
      email?: string;
      phone?: string;
    };
    batteryLevel: number | null;
    isConnected: boolean;
    lastSeen: Date;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchParticipantsData = async () => {
    try {
      setIsLoading(true);
      const userIds = participants.map(p => String(p.id));
      
      if (userIds.length === 0) {
        setParticipantsData([]);
        return;
      }

      // Obtener información de batería de Firebase
      const batteryInfo = await getMultipleUsersBatteryInfo(userIds);
      
      // Combinar datos de participantes con información de batería
      const participantsWithData = participants.map(participant => {
        const info = batteryInfo[String(participant.id)];
        return {
          user: participant,
          batteryLevel: info?.batteryLevel ?? null,
          isConnected: info?.isOnline ?? false,
          lastSeen: info?.lastSeen 
            ? new Date(info.lastSeen.seconds * 1000)
            : new Date() // Usar fecha actual si no hay lastSeen
        };
      });

      setParticipantsData(participantsWithData);
    } catch (error) {
      console.error('Error fetching participants data:', error);
      
      // En caso de error, mostrar participantes sin datos de batería
      const fallbackData = participants.map(participant => ({
        user: participant,
        batteryLevel: null,
        isConnected: false,
        lastSeen: new Date()
      }));
      
      setParticipantsData(fallbackData);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchParticipantsData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchParticipantsData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [participants, autoRefresh, refreshInterval]);

  const getBatteryIcon = (level: number | null) => {
    if (level === null) return 'battery-dead-outline';
    if (level <= 15) return 'battery-dead';
    if (level <= 25) return 'battery-half';
    if (level <= 75) return 'battery-charging';
    return 'battery-full';
  };

  const getBatteryColor = (level: number | null) => {
    if (level === null) return '#9CA3AF';
    if (level <= 15) return '#EF4444';
    if (level <= 25) return '#F59E0B';
    if (level <= 50) return '#FF9800';
    return '#4CAF50';
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    return date.toLocaleDateString();
  };

  if (isLoading && participantsData.length === 0) {
    return (
      <View style={styles.participantsLoadingContainer}>
        <Text style={styles.participantsLoadingText}>Cargando información de participantes...</Text>
      </View>
    );
  }

  if (participantsData.length === 0) {
    return (
      <View style={styles.participantsEmptyContainer}>
        <Text style={styles.participantsEmptyText}>No hay participantes en este trayecto</Text>
      </View>
    );
  }

  return (
    <View style={styles.participantsContainer}>
      {participantsData.map((participant) => (
        <View key={participant.user.id} style={styles.participantCard}>
          <View style={styles.participantInfo}>
            <View style={styles.participantAvatar}>
              <Text style={styles.participantAvatarText}>
                {participant.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
            </View>
            <View style={styles.participantDetails}>
              <Text style={styles.participantName}>{participant.user.name}</Text>
              <Text style={styles.participantLastSeen}>
                {formatLastSeen(participant.lastSeen)}
              </Text>
            </View>
          </View>

          <View style={styles.participantStatus}>
            {/* Indicador de batería */}
            <View style={styles.batteryIndicatorContainer}>
              <Ionicons 
                name={getBatteryIcon(participant.batteryLevel)} 
                size={16} 
                color={getBatteryColor(participant.batteryLevel)} 
              />
              <Text style={[
                styles.batteryIndicatorText,
                { color: getBatteryColor(participant.batteryLevel) }
              ]}>
                {participant.batteryLevel !== null ? `${participant.batteryLevel}%` : 'N/A'}
              </Text>
            </View>

            {/* Estado de conexión */}
            <View style={styles.connectionIndicator}>
              <Ionicons 
                name={participant.isConnected ? "wifi" : "wifi-outline"} 
                size={16} 
                color={participant.isConnected ? '#4CAF50' : '#FF5722'} 
              />
              <Text style={[
                styles.connectionText,
                { color: participant.isConnected ? '#4CAF50' : '#FF5722' }
              ]}>
                {participant.isConnected ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

// Componente detallado para casos donde necesites más información
export function DetailedBatteryDisplay({ 
  userId, 
  showControls = true, 
  autoRefresh = false,
  refreshInterval = 30000 
}: BatteryDisplayProps) {
  const {
    level: batteryLevel,
    isCharging,
    isLoading,
    error,
    lastUpdated,
    refreshBatteryLevel,
    syncWithFirebase
  } = useBatteryLevel({
    updateInterval: autoRefresh ? refreshInterval : 0,
    autoSync: autoRefresh,
    silentUpdate: false
  });

  const updateBatteryFromDevice = async () => {
    try {
      const level = await refreshBatteryLevel();
      
      if (level !== null) {
        await syncWithFirebase(level);
        Alert.alert('Éxito', `Nivel de batería actualizado a ${level}%`);
      } else if (batteryLevel !== null) {
        await syncWithFirebase(batteryLevel);
        Alert.alert('Advertencia', `Usando último nivel conocido: ${batteryLevel}%`);
      } else {
        Alert.alert('Error', 'No se pudo obtener el nivel de batería');
      }
    } catch (error) {
      console.error('Error updating battery level:', error);
      Alert.alert('Error', 'No se pudo actualizar el nivel de batería');
    }
  };

  const getBatteryIcon = (level: number | null) => {
    if (level === null) return 'battery-dead-outline';
    if (level <= 20) return 'battery-dead';
    if (level <= 40) return 'battery-half';
    if (level <= 80) return 'battery-charging';
    return 'battery-full';
  };

  const getBatteryColor = (level: number | null) => {
    if (level === null) return '#9CA3AF';
    if (level <= 20) return '#EF4444';
    if (level <= 40) return '#F59E0B';
    if (level <= 80) return '#10B981';
    return '#22C55E';
  };

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'Nunca';
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.detailedContainer}>
      <View style={styles.batteryInfo}>
        <Ionicons 
          name={getBatteryIcon(batteryLevel)} 
          size={32} 
          color={getBatteryColor(batteryLevel)} 
        />
        <View style={styles.textContainer}>
          <Text style={styles.batteryLevel}>
            {batteryLevel !== null ? `${batteryLevel}%` : 'Sin datos'}
            {isCharging && batteryLevel !== null ? ' ⚡' : ''}
          </Text>
          <Text style={styles.lastUpdated}>
            Actualizado: {formatLastUpdated(lastUpdated)}
          </Text>
        </View>
      </View>

      {showControls && (
        <View style={styles.controls}>
          <Pressable 
            style={[styles.button, styles.refreshButton]} 
            onPress={refreshBatteryLevel}
            disabled={isLoading}
          >
            <Ionicons name="refresh" size={20} color="#3B82F6" />
            <Text style={styles.refreshButtonText}>
              {isLoading ? 'Cargando...' : 'Refrescar'}
            </Text>
          </Pressable>

          <Pressable 
            style={[styles.button, styles.simulateButton]} 
            onPress={updateBatteryFromDevice}
            disabled={isLoading}
          >
            <Ionicons name="cloud-upload" size={20} color="#10B981" />
            <Text style={styles.simulateButtonText}>
              {isLoading ? 'Guardando...' : 'Guardar en Firebase'}
            </Text>
          </Pressable>
        </View>
      )}

      {error && (
        <Text style={[styles.lastUpdated, { color: '#EF4444', marginTop: 8 }]}>
          Error: {error}
        </Text>
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  batteryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  batteryLevel: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  refreshButton: {
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  refreshButtonText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  simulateButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  simulateButtonText: {
    color: '#10B981',
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    justifyContent: 'center',
    gap: 4,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600',
  },
  compactRefreshButton: {
    padding: 2,
    marginLeft: 4,
  },
  detailedContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  participantsContainer: {
    flex: 1,
  },
  participantsLoadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantsLoadingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  participantsEmptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantsEmptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  participantCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7A33CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  participantAvatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  participantLastSeen: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  participantStatus: {
    alignItems: 'flex-end',
    gap: 4,
  },
  batteryIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  batteryIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  batteryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});