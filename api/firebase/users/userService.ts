import { auth, db } from "../../../firebaseconfig";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

export async function ensureCurrentUserProfile(opts?: { displayName?: string; photoURL?: string; phone?: string; }) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('No hay sesión Firebase');

  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: opts?.displayName ?? null,
      photoURL: opts?.photoURL ?? null,
      phone: opts?.phone ?? null,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      isOnline: true,
    });
  } else {
    // Actualiza lastSeen (y props si quieres)
    await updateDoc(ref, {
      isOnline: true,
      lastSeen: serverTimestamp(),
      ...(opts?.displayName ? { displayName: opts.displayName } : {}),
      ...(opts?.photoURL ? { photoURL: opts.photoURL } : {}),
      ...(opts?.phone ? { phone: opts.phone } : {}),
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
export async function getUserProfileFB(uid: string) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data();
  } else {
    throw new Error('No se encontró el perfil de usuario');
  }
}