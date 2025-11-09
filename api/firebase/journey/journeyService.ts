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
 * Actualiza el estado de un Journey (por ejemplo, marcarlo como finalizado)
 */
export async function updateJourneyState(chatId: string, journeyId: string, state: JourneyState) {
  const ref = doc(db, `chats/${chatId}/journeys/${journeyId}`);
  await updateDoc(ref, {
    state,
    endedAt: state === "COMPLETED" ? serverTimestamp() : null,
  });
}

/**
 * Elimina un Journey del chat
 */
export async function deleteJourney(chatId: string, journeyId: string) {
  const ref = doc(db, `chats/${chatId}/journeys/${journeyId}`);
  await deleteDoc(ref);
}