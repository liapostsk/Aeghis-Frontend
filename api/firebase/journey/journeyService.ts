import { auth, db } from '@/firebaseconfig';
import {
  doc,
  setDoc,
  getDocs,
  collection,
  serverTimestamp,
  updateDoc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import type { Position, JourneyDoc, Participation } from '../types';
import { JourneyDto, JourneyState } from '@/api/backend/journeys/journeyType';
import { getJourney, changeJourneyStatus } from '@/api/backend/journeys/journeyApi';

/**
 * Crea un nuevo Journey dentro de un chat
 * Ruta: /chats/{chatId}/journeys/{journeyId}
 * - journeyId puede ser el ID del backend (convertido a string)
 */
export async function createJourneyInChat(chatId: string, journey: JourneyDto) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("No hay sesión activa en Firebase");

  console.log(`Creando journey ${journey} en chat ${chatId}`);

  // Crear el documento usando el tipo JourneyDoc de Firebase
  const journeyDoc: JourneyDoc = {
    ownerId: uid,
    type: journey.journeyType,
    state: journey.state,
    startedAt: serverTimestamp(),
    endedAt: journey.endDate ? serverTimestamp() : null,
  };

  const ref = doc(db, `chats/${chatId}/journeys/${journey.id}`);
  await setDoc(ref, journeyDoc);

  return ref;
}

/**
 * Obtiene todos los journeys de un chat
 */
export async function getJourneysByChat(chatId: string): Promise<(JourneyDoc & { id: string })[]> {
  const ref = collection(db, `chats/${chatId}/journeys`);
  const snap = await getDocs(ref);
  return snap.docs.map((doc) => ({ 
    id: doc.id, 
    ...doc.data() as JourneyDoc 
  }));
}

/**
 * Escucha en tiempo real los cambios de journeys en un chat
 */
export function onJourneysSnapshot(
  chatId: string, 
  callback: (journeys: (JourneyDoc & { id: string })[]) => void
) {
  const ref = collection(db, `chats/${chatId}/journeys`);
  return onSnapshot(ref, (snap) => {
    const journeys = snap.docs.map((d) => ({ 
      id: d.id, 
      ...d.data() as JourneyDoc 
    }));
    callback(journeys);
  });
}

/**
 * Actualiza el estado de un Journey en Firebase Y Backend
 * ✅ Sincronización automática: Firebase → Backend
 */
export async function updateJourneyState(
  chatId: string, 
  journeyId: string, 
  state: JourneyState
) {
  console.log(`🔄 [Sync] Actualizando estado del journey ${journeyId} a: ${state}`);
  
  try {
    // 1️⃣ Actualizar Firebase (notificaciones en tiempo real)
    const ref = doc(db, `chats/${chatId}/journeys/${journeyId}`);
    
    const firebaseUpdates: any = {
      state,
      updatedAt: serverTimestamp(),
    };
    
    if (state === 'IN_PROGRESS') {
      firebaseUpdates.startedAt = serverTimestamp();
    } else if (state === 'COMPLETED') {
      firebaseUpdates.endedAt = serverTimestamp();
    }
    
    await updateDoc(ref, firebaseUpdates);
    console.log(`✅ [Firebase] Journey ${journeyId} actualizado a: ${state}`);

    // 2️⃣ Sincronizar con el Backend usando el endpoint optimizado
    try {
      await changeJourneyStatus(Number(journeyId), state);
      console.log(`✅ [Backend] Journey ${journeyId} sincronizado correctamente`);
      
    } catch (backendError) {
      console.error(`❌ [Backend] Error sincronizando journey ${journeyId}:`, backendError);
      // Firebase ya está actualizado, pero el backend falló
      // Se podría implementar retry logic aquí si es crítico
    }
    
  } catch (error) {
    console.error(`❌ [Firebase] Error actualizando journey ${journeyId}:`, error);
    throw error;
  }
}

/**
 * Escucha cambios en el estado de un journey específico en tiempo real
 * ✅ Sincroniza automáticamente con el backend cuando detecta cambios
 */
export function listenJourneyState(
  chatId: string,
  journeyId: string,
  onStateChange: (state: string, data: any) => void,
  onError?: (error: Error) => void
): () => void {
  const journeyRef = doc(db, `chats/${chatId}/journeys/${journeyId}`);

  const unsubscribe = onSnapshot(
    journeyRef,
    async (snapshot) => {
      if (snapshot.exists()) {
        const firebaseData = snapshot.data();
        const firebaseState = firebaseData.state;
        
        console.log('🔔 [Firebase] Cambio detectado en journey:', journeyId, '→', firebaseState);
        
        try {
          // 🔄 Obtener estado del backend (fuente de verdad)
          const backendJourney = await getJourney(Number(journeyId));
          
          // Verificar si hay desincronización
          if (backendJourney.state !== firebaseState) {
            console.warn(
              `⚠️ [Sync] Desincronización detectada:`,
              `Firebase: ${firebaseState}, Backend: ${backendJourney.state}`
            );
            
            // Sincronizar backend con Firebase usando el endpoint optimizado
            await changeJourneyStatus(Number(journeyId), firebaseState);
            
            console.log(`✅ [Sync] Backend actualizado a: ${firebaseState}`);
          } else {
            console.log(`✅ [Sync] Estados sincronizados: ${firebaseState}`);
          }
          
          // Notificar al UI con el estado verificado del backend
          onStateChange(backendJourney.state, {
            firebase: firebaseData,
            backend: backendJourney,
          });
          
        } catch (backendError) {
          console.error('❌ [Backend] Error sincronizando con backend:', backendError);
          
          // Fallback: usar estado de Firebase si backend falla
          console.warn('⚠️ [Fallback] Usando estado de Firebase');
          onStateChange(firebaseState, firebaseData);
        }
        
      } else {
        console.warn('⚠️ [Firebase] Journey no encontrado:', journeyId);
      }
    },
    (error) => {
      console.error('❌ [Firebase] Error escuchando estado del journey:', error);
      onError?.(error);
    }
  );

  return unsubscribe;
}

/**
 * Elimina un Journey del chat
 */
export async function deleteJourney(chatId: string, journeyId: string) {
  const ref = doc(db, `chats/${chatId}/journeys/${journeyId}`);
  await deleteDoc(ref);
}