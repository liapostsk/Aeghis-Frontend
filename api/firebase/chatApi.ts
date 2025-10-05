// chatApi.ts
import {
  addDoc, collection, getDocs, limit, query, serverTimestamp,
  where, updateDoc, doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

export async function openOrCreateDM(otherUid: string) {
  const myUid = getAuth().currentUser!.uid;

  // Buscar si ya existe DM con ambos participantes
  const q = query(
    collection(db, 'chats'),
    where('type', '==', 'dm'),
    where('participants', 'array-contains', myUid),
    limit(20) // traemos algunos y filtramos en cliente por si acaso
  );
  const snap = await getDocs(q);
  const existing = snap.docs.find(d => {
    const p = d.data().participants as string[];
    return p.length === 2 && p.includes(myUid) && p.includes(otherUid);
  });
  if (existing) return existing.id;

  // Crear chat nuevo
  const chatRef = await addDoc(collection(db, 'chats'), {
    type: 'dm',
    participants: [myUid, otherUid],
    createdAt: serverTimestamp(),
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
  });
  return chatRef.id;
}
