import { getCurrentUser } from "@/api/backend/user/userApi";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View, StyleSheet, Pressable, Image, TouchableOpacity } from "react-native"; 
import { SafeAreaView } from "react-native-safe-area-context";
import { useTokenStore } from "@/lib/auth/tokenStore";
import { useUserStore } from "@/lib/storage/useUserStorage";
import { linkFirebaseSession, unlinkFirebaseSession } from "@/api/firebase/auth/firebase";
import { ensureCurrentUserProfile } from "@/api/firebase/users/userService";


export default function Index() {
  const { isSignedIn, userId, signOut, getToken, isLoaded } = useAuth(); // ✅ Agregar isLoaded
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(false);
  const setToken = useTokenStore((state) => state.setToken);
  const { user, clearUser } = useUserStore();

  const handleLogout = async () => {
    await unlinkFirebaseSession();
    await signOut();
    clearUser();
    console.log("🔒 Sesión cerrada");
    router.replace("/(auth)");
  };

  // Redirigir a la pantalla de tabs si existe una sesion activa en clerk o en el backend
  useEffect(() => {
    // ✅ Esperar a que Clerk termine de cargar
    if (!isLoaded) {
      console.log("⏳ Esperando a que Clerk cargue...");
      return;
    }

    const validateSession = async () => {
      console.log("🔍 Validando sesión... isSignedIn:", isSignedIn, "userId:", userId);
      
      // Si no hay sesión en Clerk, mostrar pantalla de bienvenida
      if (!isSignedIn || !userId) {
        console.log("No hay sesión en Clerk");
        await unlinkFirebaseSession().catch(() => {});
        setIsValidating(false);
        return;
      }

      setIsValidating(true);
      
      try {
        // Primero obtener el token de Clerk
        const token = await getToken();
        if (!token) {
          console.log("No se pudo obtener token de Clerk");
          // Si no hay token, cerrar sesión para reautenticar
          await unlinkFirebaseSession().catch(() => {});
          await signOut();
          router.replace("/(auth)");
          return;
        }
        
        // Guardar el token para usar en las peticiones
        setToken(token);
        console.log("Token obtenido y guardado");

        // Verificar si el usuario existe en el backend
        const currentUser = await getCurrentUser();
        
        if (currentUser) {
          console.log("Usuario existe en ambos lugares (Clerk + Backend)");
          
          try {
            console.log("Vinculando sesión de Firebase...");
            await linkFirebaseSession();

            await ensureCurrentUserProfile({
              displayName: user?.name || undefined,
              photoURL: clerkUser?.imageUrl || undefined,
              phone: clerkUser?.phoneNumbers[0].phoneNumber || undefined,
            });
            
            console.log("Sesión de Firebase vinculada");
          } catch (firebaseError) {
            console.error("Error vinculando sesión de Firebase:", firebaseError);
            // No bloquear el acceso a la app si falla Firebase
          }
          router.replace("/(tabs)");
        } else {
          console.log("Usuario existe en Clerk pero NO en backend - Borrar para mantener consistencia");
          // Borrar usuario de Clerk para mantener consistencia
          await borradoClerk();
        }        
      } catch (error: any) {
        console.error("Error verificando usuario en backend:", error);
        
        // Clasificar el tipo de error
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          console.log("Error de conectividad - Permitir acceso offline");
          // En caso de problemas de conexión, permitir acceso a la app
          try { await linkFirebaseSession(); } catch {}

          router.replace("/(tabs)");
        } else if (error.response?.status === 404) {
          console.log("Usuario no encontrado en backend - Borrar de Clerk para consistencia");
          // Usuario existe en Clerk pero no en backend, borrar para mantener consistencia
          await borradoClerk();
        } else if (error.response?.status === 401) {
          console.log("Token inválido - Volver a autenticar");
          // Token inválido, cerrar sesión para reautenticar
          await unlinkFirebaseSession().catch(() => {});
          await signOut();
          router.replace("/(auth)");
        } else {
          console.log("Error desconocido");
        }
      } finally {
        setIsValidating(false);
      }
    };

    validateSession();
  }, [isLoaded, isSignedIn, userId]); // ✅ Agregar isLoaded a dependencias

  const borradoClerk = async () => {
    try {
      console.log("Borrando usuario de Clerk por inconsistencia...");
      await unlinkFirebaseSession().catch(() => {});

      if (clerkUser) {
        await clerkUser.delete();
        console.log("Usuario borrado de Clerk");
      }

      await signOut();
      console.log("Sesión cerrada de Clerk");

      router.replace("/(auth)");

    } catch (error) {
      console.error("Error al borrar usuario de Clerk:", error);
      // En caso de error, al menos cerrar sesión
      try {
        await unlinkFirebaseSession().catch(() => {});
        await signOut();
        console.log("Sesión cerrada como fallback");
        router.replace("/(auth)");
      } catch (signOutError) {
        console.error("Error cerrando sesión:", signOutError);
        router.replace("/(auth)");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Botón de cerrar sesión (solo para debug) */}
      <Pressable 
        style={styles.debugLogoutButton} 
        onPress={handleLogout}
      >
        <Text style={styles.debugLogoutText}>🔒 Cerrar sesión</Text>
      </Pressable>
      
      <Text style={styles.textTitle}>Welcome to Aeghis!</Text>
      <Image
        source={require("../../assets/images/welcomePage.png")}
        style={styles.image}
      />
    
      <Pressable 
        style={styles.buttonSignUp}
        onPress={() => router.push("/(auth)/register")}
      >
        <Text style={styles.textSignUp}>Sign Up</Text>
      </Pressable>

      <View style={{ flexDirection: 'row', marginTop: 20, alignItems: 'center', position: 'absolute', bottom: '15%' }}>
        <Text style={{ color: 'white', fontSize: 18 }}>
          Already have an account?{'  '}
        </Text>
        <Pressable onPress={() => router.push("/(auth)/login")}>
          <Text style={{ color: "#0003B2", fontSize: 18, fontWeight: 'bold' }}>
            Log In
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// Reference for the image used in the app:
// <a href="https://storyset.com/online">Online illustrations by Storyset</a>

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "#7A33CC",
    paddingBottom: 70,
  },
  debugLogoutButton: {
    position: "absolute",
    top: 60,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  debugLogoutText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  image: {
    width: 300,
    height: 300,
    position: "absolute",
    top: "35%",
  },
  buttonSignUp: {
    backgroundColor: "#3232C3",
    padding: 30,
    width: 300,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: "20%",
    borderRadius: 20,
    borderColor: "#FFFFFF",
  },
  textSignUp: { 
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    position: "absolute",
    fontSize: 25,
  },
  textTitle: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "bold",
    position: "absolute",
    top: "15%",
  },
});