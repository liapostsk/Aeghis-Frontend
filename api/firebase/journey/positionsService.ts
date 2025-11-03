import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../../firebaseconfig';
import { Position } from '../types';

/**
 * POSITIONS SERVICE - Gestión de ubicaciones en tiempo real por participación
 * Estructura: /chats/{chatId}/journeys/{journeyId}/participants/{userId}/positions/{positionId}
 * 
 * Funcionalidades:
 * - Añadir nueva posición del usuario
 * - Obtener historial de posiciones
 * - Listener en tiempo real para posiciones actuales
 * - Limpiar posiciones antiguas
 */

// Referencia a la colección de posiciones de un participante
const getPositionsCollection = (chatId: string, journeyId: string, userId: string) => {
  return collection(db, 'chats', chatId, 'journeys', journeyId, 'participants', userId, 'positions');
};

// Referencia a un documento de posición específico
const getPositionDoc = (chatId: string, journeyId: string, userId: string, positionId: string) => {
  return doc(db, 'chats', chatId, 'journeys', journeyId, 'participants', userId, 'positions', positionId);
};

/**
 * Añadir una nueva posición para un participante
 * - Guarda automáticamente timestamp del servidor
 * - Devuelve el ID del documento creado
 */
export const addUserPosition = async (
  chatId: string,
  journeyId: string,
  userId: string,
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const positionsRef = getPositionsCollection(chatId, journeyId, userId);
    
    const newPosition: Omit<Position, 'timestamp'> & { timestamp: any } = {
      latitude,
      longitude,
      timestamp: serverTimestamp()
    };

    const docRef = await addDoc(positionsRef, newPosition);
    console.log('Posición añadida:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error añadiendo posición:', error);
    throw error;
  }
};

/**
 * Obtener la última posición de un participante
 * - Devuelve null si no hay posiciones
 */
export const getLatestUserPosition = async (
  chatId: string,
  journeyId: string,
  userId: string
): Promise<Position | null> => {
  try {
    const positionsRef = getPositionsCollection(chatId, journeyId, userId);
    const q = query(positionsRef, orderBy('timestamp', 'desc'), limit(1));
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      latitude: doc.data().latitude,
      longitude: doc.data().longitude,
      timestamp: doc.data().timestamp
    };
  } catch (error) {
    console.error('Error obteniendo última posición:', error);
    throw error;
  }
};

/**
 * Obtener historial de posiciones de un participante
 * - Ordenado por timestamp descendente (más reciente primero)
 * - Limitado a un número específico de posiciones
 */
export const getUserPositionHistory = async (
  chatId: string,
  journeyId: string,
  userId: string,
  limitCount: number = 50
): Promise<Position[]> => {
  try {
    const positionsRef = getPositionsCollection(chatId, journeyId, userId);
    const q = query(positionsRef, orderBy('timestamp', 'desc'), limit(limitCount));
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      latitude: doc.data().latitude,
      longitude: doc.data().longitude,
      timestamp: doc.data().timestamp
    }));
  } catch (error) {
    console.error('Error obteniendo historial de posiciones:', error);
    throw error;
  }
};

/**
 * Listener en tiempo real para las últimas posiciones de un participante
 * - Se actualiza automáticamente cuando hay nuevas posiciones
 * - Limitado a las últimas N posiciones
 */
export const subscribeToUserPositions = (
  chatId: string,
  journeyId: string,
  userId: string,
  callback: (positions: Position[]) => void,
  limitCount: number = 10
): Unsubscribe => {
  const positionsRef = getPositionsCollection(chatId, journeyId, userId);
  const q = query(positionsRef, orderBy('timestamp', 'desc'), limit(limitCount));

  return onSnapshot(q, (snapshot) => {
    const positions: Position[] = snapshot.docs.map(doc => ({
      latitude: doc.data().latitude,
      longitude: doc.data().longitude,
      timestamp: doc.data().timestamp
    }));
    
    callback(positions);
  }, (error) => {
    console.error('Error en listener de posiciones:', error);
  });
};

/**
 * Listener para las posiciones de TODOS los participantes de un journey
 * - Devuelve un mapa: userId -> Position[]
 * - Útil para mostrar todos los participantes en el mapa
 */
export const subscribeToAllParticipantsPositions = (
  chatId: string,
  journeyId: string,
  participantUserIds: string[],
  callback: (positionsMap: Map<string, Position[]>) => void,
  limitCount: number = 5
): Unsubscribe[] => {
  const unsubscribers: Unsubscribe[] = [];
  const positionsMap = new Map<string, Position[]>();

  participantUserIds.forEach(userId => {
    const unsubscribe = subscribeToUserPositions(
      chatId, 
      journeyId, 
      userId, 
      (positions) => {
        positionsMap.set(userId, positions);
        callback(new Map(positionsMap)); // Crear nueva instancia para trigger re-render
      },
      limitCount
    );
    
    unsubscribers.push(unsubscribe);
  });

  // Devolver función para cancelar todos los listeners
  return unsubscribers;
};

/**
 * Limpiar posiciones antiguas de un participante
 * - Mantiene solo las N posiciones más recientes
 * - Útil para evitar acumulación excesiva de datos
 */
export const cleanOldPositions = async (
  chatId: string,
  journeyId: string,
  userId: string,
  keepCount: number = 100
): Promise<void> => {
  try {
    const positionsRef = getPositionsCollection(chatId, journeyId, userId);
    const q = query(positionsRef, orderBy('timestamp', 'desc'));
    
    const snapshot = await getDocs(q);
    
    if (snapshot.docs.length <= keepCount) {
      console.log('No hay posiciones que limpiar');
      return;
    }

    // Obtener posiciones a eliminar (las más antiguas)
    const docsToDelete = snapshot.docs.slice(keepCount);
    
    // Usar batch para eliminar múltiples documentos
    const batch = writeBatch(db);
    docsToDelete.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Eliminadas ${docsToDelete.length} posiciones antiguas`);
  } catch (error) {
    console.error('Error limpiando posiciones antiguas:', error);
    throw error;
  }
};

/**
 * Eliminar todas las posiciones de un participante
 * - Útil cuando un participante abandona el journey
 */
export const deleteAllUserPositions = async (
  chatId: string,
  journeyId: string,
  userId: string
): Promise<void> => {
  try {
    const positionsRef = getPositionsCollection(chatId, journeyId, userId);
    const snapshot = await getDocs(positionsRef);
    
    if (snapshot.empty) {
      console.log('No hay posiciones que eliminar');
      return;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Eliminadas ${snapshot.docs.length} posiciones del usuario`);
  } catch (error) {
    console.error('Error eliminando posiciones del usuario:', error);
    throw error;
  }
};

/**
 * UTILIDADES DE CONVENIENCIA
 */

/**
 * Verificar si un participante tiene posiciones recientes
 * - Considera "reciente" las posiciones de los últimos X minutos
 */
export const hasRecentPosition = async (
  chatId: string,
  journeyId: string,
  userId: string,
  minutesThreshold: number = 5
): Promise<boolean> => {
  try {
    const latestPosition = await getLatestUserPosition(chatId, journeyId, userId);
    
    if (!latestPosition) {
      return false;
    }

    const now = Timestamp.now();
    const positionTime = latestPosition.timestamp as Timestamp;
    const diffMinutes = (now.seconds - positionTime.seconds) / 60;
    
    return diffMinutes <= minutesThreshold;
  } catch (error) {
    console.error('Error verificando posición reciente:', error);
    return false;
  }
};

/**
 * Calcular distancia entre dos posiciones (en metros)
 * - Usa la fórmula de Haversine
 */
export const calculateDistance = (pos1: Position, pos2: Position): number => {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (pos1.latitude * Math.PI) / 180;
  const φ2 = (pos2.latitude * Math.PI) / 180;
  const Δφ = ((pos2.latitude - pos1.latitude) * Math.PI) / 180;
  const Δλ = ((pos2.longitude - pos1.longitude) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
};