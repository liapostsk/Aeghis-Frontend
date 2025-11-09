import { auth } from '@/firebaseconfig';
import { JourneyDto } from '@/api/backend/journeys/journeyType';
import { ParticipationDto } from '@/api/backend/participations/participationType';
import { createJourneyInChat } from './journeyService';
import { joinJourneyParticipation } from './participationsService';
import { addUserPosition } from './positionsService';

/**
 * SYNC SERVICE - Sincronización entre Backend y Firebase
 * 
 * Funciones para mantener sincronizados los datos entre el backend (PostgreSQL)
 * y Firebase (tiempo real) para journeys y participaciones.
 */

/**
 * Sincronizar un journey del backend con Firebase
 * - Crea el documento de journey en Firebase si no existe
 * - Útil para journeys existentes que no están en Firebase
 */
export async function syncJourneyToFirebase(
  chatId: string,
  journey: JourneyDto
): Promise<void> {
  try {
    if (!auth.currentUser?.uid) {
      throw new Error('No hay sesión Firebase activa');
    }

    console.log(`🔄 Sincronizando journey ${journey.id} con Firebase`);
    
    // Crear journey en Firebase
    await createJourneyInChat(chatId, journey);
    
    console.log(`✅ Journey ${journey.id} sincronizado con Firebase`);
  } catch (error) {
    console.error(`❌ Error sincronizando journey ${journey.id}:`, error);
    throw error;
  }
}

/**
 * Sincronizar una participación del backend con Firebase
 * - Crea la participación en Firebase si no existe
 * - Opcionalmente añade posición inicial
 */
export async function syncParticipationToFirebase(
  chatId: string,
  journeyId: string,
  participation: ParticipationDto,
  options?: {
    destination?: { latitude: number; longitude: number };
    initialPosition?: { latitude: number; longitude: number };
  }
): Promise<void> {
  try {
    if (!auth.currentUser?.uid) {
      throw new Error('No hay sesión Firebase activa');
    }

    console.log(`🔄 Sincronizando participación ${participation.id} con Firebase`);
    
    const destinationPosition = options?.destination ? {
      latitude: options.destination.latitude,
      longitude: options.destination.longitude,
      timestamp: new Date()
    } : undefined;

    // Crear participación en Firebase
    await joinJourneyParticipation(chatId, journeyId, {
      destination: destinationPosition,
      backendParticipationId: participation.id,
      initialState: participation.state as any
    });

    // Añadir posición inicial si se proporciona
    if (options?.initialPosition && auth.currentUser?.uid) {
      await addUserPosition(
        chatId,
        journeyId,
        auth.currentUser.uid,
        options.initialPosition.latitude,
        options.initialPosition.longitude
      );
    }
    
    console.log(`✅ Participación ${participation.id} sincronizada con Firebase`);
  } catch (error) {
    console.error(`❌ Error sincronizando participación ${participation.id}:`, error);
    throw error;
  }
}

/**
 * Sincronizar un journey completo (con todas sus participaciones)
 * - Sincroniza el journey principal
 * - Sincroniza todas las participaciones asociadas
 */
export async function syncCompleteJourneyToFirebase(
  chatId: string,
  journey: JourneyDto,
  participations: ParticipationDto[]
): Promise<void> {
  try {
    console.log(`🔄 Sincronización completa del journey ${journey.id}`);
    
    // 1. Sincronizar journey principal
    await syncJourneyToFirebase(chatId, journey);
    
    // 2. Sincronizar todas las participaciones
    for (const participation of participations) {
      await syncParticipationToFirebase(chatId, journey.id.toString(), participation);
    }
    
    console.log(`✅ Journey completo ${journey.id} sincronizado con Firebase`);
  } catch (error) {
    console.error(`❌ Error en sincronización completa del journey ${journey.id}:`, error);
    throw error;
  }
}

/**
 * Verificar si un journey existe en Firebase
 * - Útil para saber si necesita sincronización
 */
export async function journeyExistsInFirebase(
  chatId: string,
  journeyId: string
): Promise<boolean> {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('@/firebaseconfig');
    
    const ref = doc(db, `chats/${chatId}/journeys/${journeyId}`);
    const snap = await getDoc(ref);
    
    return snap.exists();
  } catch (error) {
    console.error('Error verificando journey en Firebase:', error);
    return false;
  }
}

/**
 * Verificar si una participación existe en Firebase
 */
export async function participationExistsInFirebase(
  chatId: string,
  journeyId: string,
  userId: string
): Promise<boolean> {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('@/firebaseconfig');
    
    const ref = doc(db, `chats/${chatId}/journeys/${journeyId}/participants/${userId}`);
    const snap = await getDoc(ref);
    
    return snap.exists();
  } catch (error) {
    console.error('Error verificando participación en Firebase:', error);
    return false;
  }
}

/**
 * Función de utilidad para sincronizar journeys activos al cargar la app
 * - Busca journeys que no están en Firebase y los sincroniza
 */
export async function ensureActiveJourneysInFirebase(
  chatId: string,
  activeJourneys: JourneyDto[],
  allParticipations: ParticipationDto[]
): Promise<void> {
  try {
    console.log(`🔄 Verificando ${activeJourneys.length} journeys activos`);
    
    for (const journey of activeJourneys) {
      const exists = await journeyExistsInFirebase(chatId, journey.id.toString());
      
      if (!exists) {
        console.log(`📋 Journey ${journey.id} no existe en Firebase, sincronizando...`);
        
        // Obtener participaciones de este journey
        const journeyParticipations = allParticipations.filter(p => p.journeyId === journey.id);
        
        // Sincronizar journey completo
        await syncCompleteJourneyToFirebase(chatId, journey, journeyParticipations);
      } else {
        console.log(`✅ Journey ${journey.id} ya existe en Firebase`);
      }
    }
    
    console.log(`✅ Verificación de journeys activos completada`);
  } catch (error) {
    console.error('❌ Error verificando journeys activos:', error);
    // No lanzar error para no interrumpir la carga de la app
  }
}