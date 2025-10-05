// firebase.ts (cliente)
import api from "../client";
import {auth} from "@/lib/firebase";
import { signInWithCustomToken, signOut } from "firebase/auth";

export async function linkFirebaseSession() {
  if (auth.currentUser) return;

  const { data } = await api.post("/firebase/custom-token"); // body vacío

  if (!data?.customToken) {
    throw new Error("Backend no devolvió customToken");
  }
  await signInWithCustomToken(auth, data.customToken);
}


export async function unlinkFirebaseSession() {
  if (auth.currentUser) {
    try { await signOut(auth); } catch {}
  }
}
