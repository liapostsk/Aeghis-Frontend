import { auth, db } from "../../firebaseconfig";
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
      fcmTokens: {}, // mapa vacío
    });
  } else {
    // Actualiza lastSeen (y props si quieres)
    await updateDoc(ref, {
      lastSeen: serverTimestamp(),
      ...(opts?.displayName ? { displayName: opts.displayName } : {}),
      ...(opts?.photoURL ? { photoURL: opts.photoURL } : {}),
      ...(opts?.phone ? { email: opts.phone } : {}),
    });
  }
}
