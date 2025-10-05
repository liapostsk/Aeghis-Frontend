// app/chat/useMessages.ts
import {
  collection, query, orderBy, limit, onSnapshot,
  addDoc, serverTimestamp, where, getDocs, startAfter
} from "firebase/firestore";
import { db } from "@/firebaseconfig";
import { useEffect, useState } from "react";

export function useMessages(chatId: string, pageSize = 30) {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [cursor, setCursor] = useState<any | null>(null);
  const col = collection(db, "chats", chatId, "messages");

  useEffect(() => {
    const q = query(col, orderBy("createdAt", "desc"), limit(pageSize));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMsgs(docs.reverse());
      setCursor(snap.docs[snap.docs.length - 1] ?? null);
    });
    return () => unsub();
  }, [chatId]);

  const loadMore = async () => {
    if (!cursor) return;
    const q = query(col, orderBy("createdAt", "desc"), startAfter(cursor), limit(pageSize));
    const snap = await getDocs(q);
    setCursor(snap.docs[snap.docs.length - 1] ?? null);
    setMsgs((prev) => [...snap.docs.map(d => ({ id: d.id, ...d.data() })) .reverse(), ...prev]);
  };

  return { msgs, loadMore };
}
