import { useState, useEffect, useRef } from 'react';
import { Unsubscribe } from 'firebase/firestore';
import { Position } from '../../api/firebase/types';
import {
  addUserPosition,
  getLatestUserPosition,
  getUserPositionHistory,
  subscribeToUserPositions,
  subscribeToAllParticipantsPositions,
  hasRecentPosition,
  calculateDistance
} from '@/api/firebase/journey/positionsService';

/**
 * Hook para gestionar las posiciones de un participante específico
 */
export const useUserPositions = (
  chatId: string,
  journeyId: string,
  userId: string,
  limitCount: number = 10
) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [latestPosition, setLatestPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  // Suscribirse a posiciones en tiempo real
  useEffect(() => {
    if (!chatId || !journeyId || !userId) return;

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToUserPositions(
      chatId,
      journeyId,
      userId,
      (newPositions) => {
        setPositions(newPositions);
        setLatestPosition(newPositions[0] || null);
        setLoading(false);
      },
      limitCount
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [chatId, journeyId, userId, limitCount]);

  // Función para añadir una nueva posición
  const addPosition = async (latitude: number, longitude: number) => {
    try {
      setError(null);
      await addUserPosition(chatId, journeyId, userId, latitude, longitude);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error añadiendo posición');
      throw err;
    }
  };

  // Función para obtener historial completo
  const getHistory = async (limit: number = 50) => {
    try {
      setError(null);
      const history = await getUserPositionHistory(chatId, journeyId, userId, limit);
      return history;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error obteniendo historial');
      throw err;
    }
  };

  // Verificar si tiene posición reciente
  const checkRecentPosition = async (minutesThreshold: number = 5) => {
    try {
      setError(null);
      return await hasRecentPosition(chatId, journeyId, userId, minutesThreshold);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error verificando posición reciente');
      return false;
    }
  };

  return {
    positions,
    latestPosition,
    loading,
    error,
    addPosition,
    getHistory,
    checkRecentPosition
  };
};

/**
 * Hook para gestionar las posiciones de TODOS los participantes de un journey
 */
export const useAllParticipantsPositions = (
  chatId: string,
  journeyId: string,
  participantUserIds: string[],
  limitCount: number = 5
) => {
  const [positionsMap, setPositionsMap] = useState<Map<string, Position[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribersRef = useRef<Unsubscribe[]>([]);

  useEffect(() => {
    if (!chatId || !journeyId || participantUserIds.length === 0) return;

    setLoading(true);
    setError(null);

    // Limpiar suscripciones anteriores
    unsubscribersRef.current.forEach(unsubscribe => unsubscribe());
    unsubscribersRef.current = [];

    const unsubscribers = subscribeToAllParticipantsPositions(
      chatId,
      journeyId,
      participantUserIds,
      (newPositionsMap) => {
        setPositionsMap(newPositionsMap);
        setLoading(false);
      },
      limitCount
    );

    unsubscribersRef.current = unsubscribers;

    return () => {
      unsubscribersRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribersRef.current = [];
    };
  }, [chatId, journeyId, JSON.stringify(participantUserIds), limitCount]);

  // Obtener la última posición de cada participante
  const getLatestPositions = () => {
    const latestMap = new Map<string, Position | null>();
    
    positionsMap.forEach((positions, userId) => {
      latestMap.set(userId, positions[0] || null);
    });
    
    return latestMap;
  };

  // Calcular distancias entre participantes
  const calculateDistancesBetweenParticipants = () => {
    const latestPositions = getLatestPositions();
    const distances = new Map<string, Map<string, number>>();
    
    latestPositions.forEach((pos1, userId1) => {
      if (!pos1) return;
      
      const userDistances = new Map<string, number>();
      
      latestPositions.forEach((pos2, userId2) => {
        if (!pos2 || userId1 === userId2) return;
        
        const distance = calculateDistance(pos1, pos2);
        userDistances.set(userId2, distance);
      });
      
      distances.set(userId1, userDistances);
    });
    
    return distances;
  };

  return {
    positionsMap,
    loading,
    error,
    getLatestPositions,
    calculateDistancesBetweenParticipants
  };
};

/**
 * Hook para tracking automático de posición del usuario actual
 * - Envía posiciones periódicamente mientras el journey esté activo
 */
export const usePositionTracking = (
  chatId: string,
  journeyId: string,
  userId: string,
  options: {
    enabled: boolean;
    intervalMs?: number;
    highAccuracy?: boolean;
  }
) => {
  const [isTracking, setIsTracking] = useState(false);
  const [lastSentPosition, setLastSentPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const { enabled, intervalMs = 30000, highAccuracy = true } = options;

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: highAccuracy,
          timeout: 10000,
          maximumAge: 5000
        }
      );
    });
  };

  const sendPosition = async () => {
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      
      await addUserPosition(chatId, journeyId, userId, latitude, longitude);
      
      setLastSentPosition({
        latitude,
        longitude,
        timestamp: new Date()
      });
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error enviando posición');
      console.error('Error sending position:', err);
    }
  };

  // Iniciar/detener tracking
  useEffect(() => {
    if (!enabled || !chatId || !journeyId || !userId) {
      setIsTracking(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setIsTracking(true);
    setError(null);

    // Enviar posición inicial inmediatamente
    sendPosition();

    // Configurar intervalo para enviar posiciones periódicamente
    intervalRef.current = setInterval(sendPosition, intervalMs);

    return () => {
      setIsTracking(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, chatId, journeyId, userId, intervalMs]);

  const startTracking = () => {
    if (!isTracking) {
      sendPosition();
    }
  };

  const stopTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTracking(false);
  };

  return {
    isTracking,
    lastSentPosition,
    error,
    startTracking,
    stopTracking,
    sendPosition: () => sendPosition()
  };
};