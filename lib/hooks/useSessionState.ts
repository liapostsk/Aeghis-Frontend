import { useAuth, useUser } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/api/backend/user/userApi";
import { useTokenStore } from "@/lib/auth/tokenStore";
import { useUserStore } from "@/lib/storage/useUserStorage";
import { linkFirebaseSession, unlinkFirebaseSession } from "@/api/firebase/auth/firebase";

export type SessionState = "checking" | "noSession" | "needsProfile" | "ready" | "admin" | "inconsistent";

/**
 * Hook que valida el estado de la sesión del usuario
 * y maneja la limpieza en caso de inconsistencias
 */
export function useSessionState() {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const { user: localUser, clearUser } = useUserStore();
  const [state, setState] = useState<SessionState>("checking");
  const setToken = useTokenStore(s => s.setToken);

  /**
   * Borra el usuario de Clerk por inconsistencia con backend
   * Útil cuando:
   * - Usuario existe en Clerk pero NO en backend
   * - Se quiere liberar las credenciales para reintentar registro
   */
  const cleanupClerkUser = async (reason: string) => {
    try {
      console.log(`Borrando usuario de Clerk: ${reason}`);
      
      // 1. Desvincular Firebase
      await unlinkFirebaseSession().catch(() => {});

      // 2. Borrar usuario de Clerk (libera email/teléfono)
      if (clerkUser) {
        await clerkUser.delete();
        console.log("Usuario borrado de Clerk");
      }

      // 3. Cerrar sesión
      await signOut();
      console.log("Sesión cerrada");

      setState("noSession");
    } catch (error) {
      console.error("Error al limpiar Clerk:", error);
      
      // Fallback: al menos cerrar sesión
      try {
        await unlinkFirebaseSession().catch(() => {});
        await signOut();
        setState("noSession");
      } catch (signOutError) {
        console.error("Error crítico cerrando sesión:", signOutError);
        setState("noSession");
      }
    }
  };

  useEffect(() => {
    if (!isLoaded) {
      console.log("Clerk aún no cargó...");
      return;
    }

    const validateSession = async () => {
      console.log("Validando sesión...", { isSignedIn });

      if (!isSignedIn) {
        console.log("No hay sesión en Clerk");
        await unlinkFirebaseSession().catch(() => {});
        clearUser();
        setState("noSession");
        return;
      }

      if (localUser && localUser.clerkId && clerkUser && localUser.clerkId !== clerkUser.id) {
        console.log(
          "Usuario local pertenece a otra sesión de Clerk. Limpiando store local."
        );
        clearUser();
      }

      const effectiveLocalUser = (localUser && localUser.clerkId === clerkUser?.id)
        ? localUser
        : undefined;

      // Si hay usuario local válido (mismo clerkId) → usar su rol
      if (effectiveLocalUser?.id) {
        console.log("Usuario encontrado en store local (ID:", localUser?.id, ")");
        console.log("Rol del usuario:", localUser?.role);

        if (localUser?.role === 'ADMIN') {
          console.log("Usuario es ADMIN → Estado: admin");
          setState("admin");
        } else {
          console.log("Usuario normal → Estado: ready");
          setState("ready");
        }
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          console.log("No se pudo obtener token");
          await cleanupClerkUser("Token inválido");
          return;
        }

        setToken(token);
        console.log("Token obtenido y guardado");
      } catch (tokenError) {
        console.error("Error obteniendo token:", tokenError);
        await cleanupClerkUser("Error obteniendo token");
        return;
      }

      try {
        const user = await getCurrentUser();
        
        if (user) {
          console.log("Usuario existe en Clerk + Backend");
          console.log("Rol del usuario desde backend:", user.role);
          
          try {
            await linkFirebaseSession();
            console.log("Firebase vinculado");
          } catch (firebaseError) {
            console.warn(" Error vinculando Firebase (no crítico):", firebaseError);
          }
          
          // Verificar rol y establecer estado
          if (user.role === 'ADMIN') {
            console.log("Usuario es ADMIN → Estado: admin");
            setState("admin");
          } else {
            console.log("Usuario normal → Estado: ready");
            setState("ready");
          }
        } else {
          // Usuario en Clerk pero NO en backend → Inconsistencia
          console.log("Usuario en Clerk pero NO en backend");
          setState("inconsistent");
          
          // Limpiar Clerk automáticamente para permitir re-registro
          await cleanupClerkUser("Usuario no existe en backend");
        }
      } catch (error: any) {
        console.log("X -> Error verificando backend:", error);

        // Clasificar errores
        if (error.response?.status === 404) {
          console.log("404: Usuario nuevo → needsProfile");
          setState("needsProfile");
          
        } else if (error.response?.status === 401) {
          console.log("401: Token inválido → limpiar sesión");
          await cleanupClerkUser("Token inválido (401)");
          
        } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          console.log("Timeout: Permitir acceso offline → ready");
          setState("ready");
          
        } else if (error.response?.status === 409) {
          console.log("409: Conflicto en backend → limpiar sesión");
          await cleanupClerkUser("Conflicto en backend (409)");
          
        } else {
          // Error desconocido → Por seguridad, limpiar
          console.log("Error desconocido → limpiar sesión");
          await cleanupClerkUser("Error desconocido");
        }
      }
    };

    validateSession();
  }, [isLoaded, isSignedIn, clerkUser?.id, localUser?.id, localUser?.role, localUser?.clerkId]);

  return { state, cleanupClerkUser };
}
