import { auth, db } from "../../../firebaseconfig";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { 
  FirebaseUserProfile, 
  FirebaseUserProfileUpdate, 
  FirebaseUserProfileOptions,
} from '../types';

export async function ensureCurrentUserProfile(opts?: FirebaseUserProfileOptions) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('No hay sesión Firebase');

  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const newProfile: FirebaseUserProfile = {
      displayName: opts?.displayName ?? null,
      photoURL: opts?.photoURL ?? null,
      phone: opts?.phone ?? null,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      isOnline: true,
      batteryLevel: opts?.batteryLevel ?? null,
    };
    await setDoc(ref, newProfile);
  } else {
    // Actualiza lastSeen (y props si quieres)
    await updateDoc(ref, {
      isOnline: true,
      lastSeen: serverTimestamp(),
      ...(opts?.displayName ? { displayName: opts.displayName } : {}),
      ...(opts?.photoURL ? { photoURL: opts.photoURL } : {}),
      ...(opts?.phone ? { phone: opts.phone } : {}),
      ...(opts?.batteryLevel !== undefined ? { batteryLevel: opts.batteryLevel } : {}),
    });
  }
}

// Función para actualizar el perfil, al cerrar sesion de firebase
export async function updateUserProfileOnLogout() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('No hay sesión Firebase');

  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    // Actualiza lastSeen y isOnline a false
    await updateDoc(ref, {
      lastSeen: serverTimestamp(),
      isOnline: false,
    });
  } else {
    console.warn('No se encontró el perfil de usuario al cerrar sesión');
  }
}

// Obtener informacion del perfil del usuario
export async function getUserProfileFB(uid: string): Promise<FirebaseUserProfile> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as FirebaseUserProfile;
  } else {
    throw new Error('No se encontró el perfil de usuario');
  }
}

// A diferencia de firebaseStorage, Firestore solo almacena metadatos, no archivos (urls)

// Actualizar la foto de perfil del usuario en Firebase
export async function updateUserPhotoURL(photoURL: string | null) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('No hay sesión Firebase');

  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
    photoURL: photoURL,
    lastSeen: serverTimestamp(),
  });
}

// Actualizar múltiples campos del perfil
export async function updateUserProfile(updates: FirebaseUserProfileUpdate) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('No hay sesión Firebase');

  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
    ...updates,
    lastSeen: serverTimestamp(),
  });
}

// ===== FUNCIONES ESPECÍFICAS PARA BATTERY LEVEL =====

// Actualizar solo el nivel de batería del usuario actual
export async function updateUserBatteryLevel(batteryLevel: number) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('No hay sesión Firebase');

  // Validar que el nivel esté entre 0 y 100
  if (batteryLevel < 0 || batteryLevel > 100) {
    throw new Error('El nivel de batería debe estar entre 0 y 100');
  }

  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
    batteryLevel,
    lastSeen: serverTimestamp(),
  });
}

// Obtener el nivel de batería de un usuario específico
export async function getUserBatteryLevel(uid: string): Promise<number | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data() as FirebaseUserProfile;
    return data.batteryLevel;
  } else {
    throw new Error('No se encontró el perfil de usuario');
  }
}

// Obtener el nivel de batería del usuario actual
export async function getCurrentUserBatteryLevel(): Promise<number | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('No hay sesión Firebase');

  return await getUserBatteryLevel(uid);
}

// Obtener información completa de batería de múltiples usuarios
export async function getMultipleUsersBatteryInfo(userIds: string[]): Promise<Record<string, { batteryLevel: number | null; lastSeen: any; isOnline: boolean }>> {
  const promises = userIds.map(async (uid) => {
    try {
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      
      if (snap.exists()) {
        const data = snap.data() as FirebaseUserProfile;
        return {
          uid,
          batteryLevel: data.batteryLevel,
          lastSeen: data.lastSeen,
          isOnline: data.isOnline,
        };
      }
      return {
        uid,
        batteryLevel: null,
        lastSeen: null,
        isOnline: false,
      };
    } catch (error) {
      console.error(`Error getting battery info for user ${uid}:`, error);
      return {
        uid,
        batteryLevel: null,
        lastSeen: null,
        isOnline: false,
      };
    }
  });

  const results = await Promise.all(promises);
  const batteryInfo: Record<string, { batteryLevel: number | null; lastSeen: any; isOnline: boolean }> = {};
  
  results.forEach((result) => {
    batteryInfo[result.uid] = {
      batteryLevel: result.batteryLevel,
      lastSeen: result.lastSeen,
      isOnline: result.isOnline,
    };
  });

  return batteryInfo;
}

// Función para actualizar batería de forma silenciosa (sin actualizar lastSeen)
export async function updateBatteryLevelSilent(batteryLevel: number) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('No hay sesión Firebase');

  // Validar que el nivel esté entre 0 y 100
  if (batteryLevel < 0 || batteryLevel > 100) {
    throw new Error('El nivel de batería debe estar entre 0 y 100');
  }

  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { batteryLevel });
}