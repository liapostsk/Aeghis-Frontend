import { auth, db } from "@/firebaseconfig";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { 
  FirebaseUserProfile, 
  FirebaseUserProfileUpdate, 
  FirebaseUserProfileOptions,
} from '../types';

export async function ensureCurrentUserProfile(opts?: FirebaseUserProfileOptions) {
  const uid = auth.currentUser?.uid;
  console.log('🔐 ensureCurrentUserProfile - Usuario actual:', uid);
  console.log('📝 ensureCurrentUserProfile - Opciones:', opts);
  
  if (!uid) {
    console.error('❌ No hay sesión Firebase en ensureCurrentUserProfile');
    throw new Error('No hay sesión Firebase');
  }

  try {
    const ref = doc(db, 'users', uid);
    console.log('📖 Verificando si existe perfil de usuario...');
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      console.log('📝 Creando nuevo perfil de usuario...');
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
      console.log('✅ Perfil de usuario creado exitosamente');
    } else {
      console.log('🔄 Actualizando perfil de usuario existente...');
      // Actualiza lastSeen (y props si quieres)
      await updateDoc(ref, {
        isOnline: true,
        lastSeen: serverTimestamp(),
        ...(opts?.displayName ? { displayName: opts.displayName } : {}),
        ...(opts?.photoURL ? { photoURL: opts.photoURL } : {}),
        ...(opts?.phone ? { phone: opts.phone } : {}),
        ...(opts?.batteryLevel !== undefined ? { batteryLevel: opts.batteryLevel } : {}),
      });
      console.log('✅ Perfil de usuario actualizado exitosamente');
    }
  } catch (error) {
    console.error('💥 Error en ensureCurrentUserProfile:', error);
    console.error('📋 Error details:', {
      code: error.code,
      message: error.message,
      uid
    });
    throw error;
  }
}

// Función para actualizar el perfil, al cerrar sesion de firebase
export async function updateUserProfileOnLogout() {
  const uid = auth.currentUser?.uid;
  console.log('👋 updateUserProfileOnLogout - Usuario:', uid);
  
  if (!uid) {
    console.error('❌ No hay sesión Firebase en logout');
    throw new Error('No hay sesión Firebase');
  }

  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      console.log('🔄 Marcando usuario como offline...');
      await updateDoc(ref, {
        lastSeen: serverTimestamp(),
        isOnline: false,
      });
      console.log('✅ Usuario marcado como offline exitosamente');
    } else {
      console.warn('⚠️ No se encontró el perfil de usuario al cerrar sesión');
    }
  } catch (error) {
    console.error('💥 Error en updateUserProfileOnLogout:', error);
    throw error;
  }
}

// ===== FUNCIONES ELIMINADAS - NO SE USAN =====
// - getUserProfileFB() - No se usa en ningún lugar
// - updateUserPhotoURL() - No se usa en ningún lugar  
// - updateUserProfile() - No se usa en ningún lugar

// ===== FUNCIONES ESPECÍFICAS PARA BATTERY LEVEL =====

// Actualizar solo el nivel de batería del usuario actual
export async function updateUserBatteryLevel(batteryLevel: number) {
  const uid = auth.currentUser?.uid;
  console.log('🔋 updateUserBatteryLevel - Usuario:', uid, 'Nivel:', batteryLevel);
  
  if (!uid) {
    console.error('❌ No hay sesión Firebase en updateUserBatteryLevel');
    throw new Error('No hay sesión Firebase');
  }

  // Validar que el nivel esté entre 0 y 100
  if (batteryLevel < 0 || batteryLevel > 100) {
    console.warn('⚠️ Nivel de batería fuera de rango:', batteryLevel, '- Ajustando a rango válido');
    batteryLevel = Math.max(0, Math.min(100, batteryLevel));
  }

  try {
    console.log('💾 Actualizando nivel de batería en Firebase...');
    const ref = doc(db, 'users', uid);
    await updateDoc(ref, {
      batteryLevel,
      lastSeen: serverTimestamp(),
    });
    console.log('✅ Nivel de batería actualizado exitosamente');
  } catch (error) {
    console.error('💥 Error actualizando nivel de batería:', error);
    console.error('📋 Error details:', {
      code: error.code,
      message: error.message,
      uid,
      batteryLevel
    });
    throw error;
  }
}

// ===== FUNCIONES ELIMINADAS - NO SE USAN =====
// - getUserBatteryLevel() - Solo se usa internamente, no exportada
// - getCurrentUserBatteryLevel() - No se usa en la práctica

// Función interna para obtener batería (no exportada)
async function getUserBatteryLevel(uid: string): Promise<number | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data() as FirebaseUserProfile;
    return data.batteryLevel;
  } else {
    return null; // En lugar de error, devolver null
  }
}

// Obtener información completa de batería de múltiples usuarios
export async function getMultipleUsersBatteryInfo(userIds: string[]): Promise<Record<string, { batteryLevel: number | null; lastSeen: any; isOnline: boolean }>> {
  console.log('👥 getMultipleUsersBatteryInfo - Usuarios:', userIds.length);
  
  if (userIds.length === 0) {
    console.log('ℹ️ No hay usuarios para obtener información de batería');
    return {};
  }

  try {
    const promises = userIds.map(async (uid) => {
      try {
        console.log(`📖 Obteniendo info de usuario: ${uid}`);
        const ref = doc(db, 'users', uid);
        const snap = await getDoc(ref);
        
        if (snap.exists()) {
          const data = snap.data() as FirebaseUserProfile;
          console.log(`✅ Info obtenida para ${uid}:`, { 
            batteryLevel: data.batteryLevel, 
            isOnline: data.isOnline 
          });
          return {
            uid,
            batteryLevel: data.batteryLevel,
            lastSeen: data.lastSeen,
            isOnline: data.isOnline,
          };
        }
        console.log(`⚠️ Usuario ${uid} no encontrado`);
        return {
          uid,
          batteryLevel: null,
          lastSeen: null,
          isOnline: false,
        };
      } catch (error) {
        console.error(`💥 Error obteniendo info para usuario ${uid}:`, error);
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

    console.log('✅ Información de batería obtenida para todos los usuarios');
    return batteryInfo;
  } catch (error) {
    console.error('💥 Error general en getMultipleUsersBatteryInfo:', error);
    throw error;
  }
}

// ===== FUNCIONES ELIMINADAS - NO SE USAN =====
// - updateBatteryLevelSilent() - No se usa en ningún lugar