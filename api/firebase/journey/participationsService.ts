import { auth, db } from '@/firebaseconfig';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  getDocs,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';

import type { Position, Participation } from '../types';
import { ParticipationState } from '@/api/backend/participations/participationType';

/**
 * Unirse a un Journey (crea/actualiza la participación del usuario actual)
 * Ruta: /chats/{chatId}/journeys/{journeyId}/participants/{uid}
 * - Evita duplicados usando docId = uid
 * - Opcionalmente guarda destino y el id de participación del backend
 * - Estado inicial por defecto: PENDING
 */
export async function joinJourneyParticipation(
  chatId: string,
  journeyId: string,
  opts?: {
    destination?: Position;
    backendParticipationId?: number | string;
    initialState?: ParticipationState;
  }
) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('No hay sesión Firebase');

  const pRef = doc(db, `chats/${chatId}/journeys/${journeyId}/participants/${uid}`);

  // Transacción para crear si no existe o actualizar sin romper timestamps
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(pRef);

    const base: Participation = {
      userId: uid,
      journeyId: journeyId,
      state: opts?.initialState ?? 'PENDING',
      destination: opts?.destination,
      backendParticipationId: opts?.backendParticipationId,
      joinedAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    if (!snap.exists()) {
      tx.set(pRef, base);
    } else {
      // Si ya existe, solo refrescamos campos mutables
      const existingData = snap.data() as Participation;
      tx.update(pRef, {
        state: opts?.initialState ?? existingData.state ?? 'PENDING',
        destination: opts?.destination ?? existingData.destination ?? null,
        backendParticipationId: opts?.backendParticipationId ?? existingData.backendParticipationId ?? null,
        updatedAt: serverTimestamp(),
      });
    }
  });

  return pRef;
}

/** Abandonar el Journey (marca como LEFT o elimina, tú eliges) */
export async function leaveJourneyParticipation(
  chatId: string,
  journeyId: string,
  { hardDelete = false }: { hardDelete?: boolean } = {}
) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('No hay sesión Firebase');

  const pRef = doc(db, `chats/${chatId}/journeys/${journeyId}/participants/${uid}`);

  if (hardDelete) {
    await deleteDoc(pRef);
  } else {
    await updateDoc(pRef, {
      state: 'CANCELLED',
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Cambiar el estado de una participación
 * Estados posibles: PENDING, ACCEPTED, REJECTED, CANCELLED, COMPLETED
 * - Acepta transacciones para consistencia con operaciones atómicas
 * - Actualiza automáticamente la fecha de modificación
 */
export async function setParticipationState(
  chatId: string,
  journeyId: string,
  userId: string, // permite que un admin cambie el estado de otros si tus reglas lo permiten
  state: ParticipationState
) {
  const pRef = doc(db, `chats/${chatId}/journeys/${journeyId}/participants/${userId}`);
  await updateDoc(pRef, { state, updatedAt: serverTimestamp() });
}

/** Actualizar destino del participante (si lo cambia) */
export async function setParticipationDestination(
  chatId: string,
  journeyId: string,
  userId: string,
  destination: Position | null
) {
  const pRef = doc(db, `chats/${chatId}/journeys/${journeyId}/participants/${userId}`);
  await updateDoc(pRef, { destination, updatedAt: serverTimestamp() });
}

/** Obtener todas las participaciones del Journey */
export async function getParticipants(
  chatId: string,
  journeyId: string
): Promise<(Participation & { id: string })[]> {
  const cRef = collection(db, `chats/${chatId}/journeys/${journeyId}/participants`);
  const snap = await getDocs(cRef);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Participation) }));
}

/** Escuchar participaciones en tiempo real */
export function onParticipantsSnapshot(
  chatId: string,
  journeyId: string,
  cb: (participants: (Participation & { id: string })[]) => void
) {
  const cRef = collection(db, `chats/${chatId}/journeys/${journeyId}/participants`);
  return onSnapshot(cRef, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Participation) }));
    cb(list);
  });
}

/** Obtener participación específica de un usuario */
export async function getUserParticipation(
  chatId: string,
  journeyId: string,
  userId?: string
): Promise<(Participation & { id: string }) | null> {
  const uid = userId ?? auth.currentUser?.uid;
  if (!uid) throw new Error('No hay usuario especificado ni sesión Firebase');

  const pRef = doc(db, `chats/${chatId}/journeys/${journeyId}/participants/${uid}`);
  const snap = await getDoc(pRef);
  
  if (!snap.exists()) return null;
  
  return { id: snap.id, ...(snap.data() as Participation) };
}

/** Verificar si el usuario actual está participando en el journey */
export async function isUserParticipating(
  chatId: string,
  journeyId: string,
  userId?: string
): Promise<boolean> {
  const participation = await getUserParticipation(chatId, journeyId, userId);
  return participation !== null && participation.state !== 'CANCELLED' && participation.state !== 'REJECTED';
}

/** Obtener conteo de participantes por estado */
export async function getParticipantsCount(
  chatId: string,
  journeyId: string
): Promise<{ [K in ParticipationState]: number }> {
  const participants = await getParticipants(chatId, journeyId);
  
  const counts = {
    PENDING: 0,
    ACCEPTED: 0,
    REJECTED: 0,
    CANCELLED: 0,
    COMPLETED: 0,
  } as { [K in ParticipationState]: number };

  participants.forEach(p => {
    counts[p.state]++;
  });

  return counts;
}
