import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { 
  initializeAuth, 
  getAuth,
  getReactNativePersistence 
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// credenciales unicas del proyecto Firebase
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

// Esta función inicializa el SDK de Firebase en tu aplicación
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth = getAuth(app);
if (Platform.OS !== 'web') {
  try {
    /*
        Esta parte inicializa el SDK de Firebase Authentication. 
        La distinción entre getAuth e initializeAuth con persistence es clave 
        para aplicaciones móviles. La persistence asegura que el estado de 
        autenticación del usuario (es decir, que ya ha iniciado sesión) se guarde 
        localmente en el dispositivo.
    */

    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // ya estaba inicializado (Fast Refresh)
    auth = getAuth(app);
  }
}

// Inicializa el SDK de Cloud Firestore
const db = getFirestore(app);

// Inicializa el SDK de Cloud Storage for Firebase, si el chat permite subir archivos como imágenes
// en los mensajes de Firestore, solo se guardarán las URLs de esos archivos en Firestore
const storage = getStorage(app);


export { app, auth , db, storage};

/*
    Conectarse a tu proyecto Firebase.
    Autenticar usuarios (y por lo tanto, no sabría quién es quién en el chat).
    Leer y escribir mensajes en Cloud Firestore.
    Subir archivos multimedia para el chat.
*/