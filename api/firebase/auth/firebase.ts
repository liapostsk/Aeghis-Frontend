import api from "../../client";
import {auth} from "../../../firebaseconfig";
import { signInWithCustomToken, signOut } from "firebase/auth";

export async function linkFirebaseSession() {
  // Propiedad de Firebase Auth que indica si ya hay un usuario logueado
  if (auth.currentUser) return;

  // Llamada a mi backend para obtener un Firebase Custom Token
  const { data } = await api.post("/firebase/custom-token"); // body vacío

  // Si el body no tiene customToken, lanzar error
  if (!data?.customToken) {
    console.log("ERROR de Firebase: customToken no recibido", data);
    throw new Error("Backend no devolvió customToken");
  }
  console.log("Firebase: customToken recibido del backend: ", data.customToken);
  // Usar el customToken para loguear en Firebase
  await signInWithCustomToken(auth, data.customToken);
}


export async function unlinkFirebaseSession() {
  if (auth.currentUser) {
    try { await signOut(auth); } catch {}
  }
}
