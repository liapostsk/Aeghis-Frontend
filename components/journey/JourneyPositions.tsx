import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert } from 'react-native';
import { useUserPositions, useAllParticipantsPositions, usePositionTracking } from '../../lib/hooks/usePositions';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Timestamp } from 'firebase/firestore';

interface JourneyPositionsProps {
  chatId: string;
  journeyId: string;
  participantUserIds: string[];
  isJourneyActive: boolean;
}

const JourneyPositions: React.FC<JourneyPositionsProps> = ({
  chatId,
  journeyId,
  participantUserIds,
  isJourneyActive
}) => {
  const { user } = useUser();
  const [trackingEnabled, setTrackingEnabled] = useState(isJourneyActive);

  // Hook para las posiciones del usuario actual
  const {
    positions: myPositions,
    latestPosition: myLatestPosition,
    loading: myPositionsLoading,
    error: myPositionsError,
    addPosition,
    checkRecentPosition
  } = useUserPositions(chatId, journeyId, user?.id || '');

  // Hook para las posiciones de todos los participantes
  const {
    positionsMap,
    loading: allPositionsLoading,
    error: allPositionsError,
    getLatestPositions,
    calculateDistancesBetweenParticipants
  } = useAllParticipantsPositions(chatId, journeyId, participantUserIds);

  // Hook para tracking automático de posición
  const {
    isTracking,
    lastSentPosition,
    error: trackingError,
    startTracking,
    stopTracking,
    sendPosition
  } = usePositionTracking(chatId, journeyId, user?.id || '', {
    enabled: trackingEnabled && isJourneyActive,
    intervalMs: 30000, // Enviar cada 30 segundos
    highAccuracy: true
  });

  // Manejar cambio en el switch de tracking
  const handleTrackingToggle = (enabled: boolean) => {
    setTrackingEnabled(enabled);
    if (enabled) {
      startTracking();
    } else {
      stopTracking();
    }
  };

  // Enviar posición manualmente
  const handleSendPosition = async () => {
    try {
      await sendPosition();
      Alert.alert('Éxito', 'Posición enviada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar la posición');
    }
  };

  // Formatear timestamp
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    let date: Date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleTimeString();
  };

  // Obtener distancias entre participantes
  const getDistances = () => {
    if (!user?.id) return new Map();
    return calculateDistancesBetweenParticipants();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Posiciones del Journey</Text>
      
      {/* Control de Tracking */}
      <View style={styles.trackingControl}>
        <Text style={styles.sectionTitle}>Control de Ubicación</Text>
        <View style={styles.switchRow}>
          <Text>Tracking automático:</Text>
          <Switch
            value={trackingEnabled}
            onValueChange={handleTrackingToggle}
            disabled={!isJourneyActive}
          />
        </View>
        
        {isTracking && (
          <Text style={styles.trackingStatus}>
            ✅ Enviando ubicación cada 30 segundos
          </Text>
        )}
        
        {lastSentPosition && (
          <Text style={styles.lastSent}>
            Última enviada: {formatTimestamp(lastSentPosition.timestamp)}
          </Text>
        )}
      </View>

      {/* Mi Posición Actual */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mi Posición</Text>
        {myPositionsLoading ? (
          <Text>Cargando mi posición...</Text>
        ) : myLatestPosition ? (
          <View style={styles.positionCard}>
            <Text>Lat: {myLatestPosition.latitude.toFixed(6)}</Text>
            <Text>Lng: {myLatestPosition.longitude.toFixed(6)}</Text>
            <Text>Hora: {formatTimestamp(myLatestPosition.timestamp)}</Text>
          </View>
        ) : (
          <Text>No hay posición disponible</Text>
        )}
        
        {myPositionsError && (
          <Text style={styles.error}>Error: {myPositionsError}</Text>
        )}
      </View>

      {/* Historial de Mis Posiciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mi Historial ({myPositions.length})</Text>
        {myPositions.slice(0, 5).map((position, index) => (
          <View key={index} style={styles.historyItem}>
            <Text style={styles.historyText}>
              #{index + 1}: {position.latitude.toFixed(4)}, {position.longitude.toFixed(4)} 
              - {formatTimestamp(position.timestamp)}
            </Text>
          </View>
        ))}
      </View>

      {/* Posiciones de Todos los Participantes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Todos los Participantes</Text>
        {allPositionsLoading ? (
          <Text>Cargando posiciones...</Text>
        ) : (
          <>
            {Array.from(positionsMap.entries()).map(([userId, positions]) => {
              const latestPos = positions[0];
              const isMe = userId === user?.id;
              
              return (
                <View key={userId} style={styles.participantCard}>
                  <Text style={styles.participantTitle}>
                    {isMe ? 'Yo' : `Usuario ${userId.slice(-4)}`}
                  </Text>
                  {latestPos ? (
                    <View>
                      <Text>Lat: {latestPos.latitude.toFixed(6)}</Text>
                      <Text>Lng: {latestPos.longitude.toFixed(6)}</Text>
                      <Text>Hora: {formatTimestamp(latestPos.timestamp)}</Text>
                      <Text style={styles.positionCount}>
                        {positions.length} posiciones registradas
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.noPosition}>Sin posición</Text>
                  )}
                </View>
              );
            })}
          </>
        )}
        
        {allPositionsError && (
          <Text style={styles.error}>Error: {allPositionsError}</Text>
        )}
      </View>

      {/* Distancias Entre Participantes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Distancias</Text>
        {(() => {
          const distances = getDistances();
          const myDistances = distances.get(user?.id || '');
          
          if (!myDistances || myDistances.size === 0) {
            return <Text>No hay distancias calculables</Text>;
          }
          
          return Array.from(myDistances.entries()).map(([otherUserId, distance]) => (
            <Text key={otherUserId} style={styles.distanceText}>
              A Usuario {otherUserId.slice(-4)}: {Math.round(distance)}m
            </Text>
          ));
        })()}
      </View>

      {/* Errores de Tracking */}
      {trackingError && (
        <View style={styles.errorSection}>
          <Text style={styles.error}>Error de tracking: {trackingError}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  trackingControl: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackingStatus: {
    color: '#4CAF50',
    fontSize: 14,
    marginBottom: 4,
  },
  lastSent: {
    color: '#666',
    fontSize: 12,
  },
  positionCard: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  participantCard: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  participantTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#2196F3',
  },
  historyItem: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  historyText: {
    fontSize: 12,
    color: '#666',
  },
  positionCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  noPosition: {
    color: '#999',
    fontStyle: 'italic',
  },
  distanceText: {
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
    color: '#1976d2',
  },
  error: {
    color: '#f44336',
    fontSize: 14,
    marginTop: 8,
  },
  errorSection: {
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
});

export default JourneyPositions;