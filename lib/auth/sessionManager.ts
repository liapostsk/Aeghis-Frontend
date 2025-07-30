// lib/auth/sessionManager.ts
import { useSignUp, useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from './tokenStore';
import { useUserStore } from '../storage/useUserStorage';
import { Alert } from 'react-native';

/**
 * Hook para activar la sesión de Clerk de forma segura dentro de un componente
 * Solo se debe llamar cuando realmente se necesite hacer llamadas al backend
 */
export const useActivateClerkSession = () => {
  const { signUp, setActive } = useSignUp();
  const { getToken } = useAuth();
  const { sessionActivated, setSessionActivated, setToken } = useTokenStore();
  const { user, setUser } = useUserStore();

  const activateSession = async () => {
    // Si ya está activada, no hacer nada
    if (sessionActivated) {
      console.log("Sesión ya activada, saltando...");
      return;
    }

    try {
      if (!signUp?.createdSessionId) {
        throw new Error("No hay sesión de signup disponible para activar");
      }

      console.log("🔄 Activando sesión de Clerk...");

      // Activar la sesión
      await setActive({ session: signUp.createdSessionId });
      
      // Obtener el token
      const token = await getToken();
      if (!token) {
        throw new Error("Failed to get authentication token");
      }
      
      // Obtener el ID de Clerk del usuario
      const clerkUserId = signUp.createdUserId;
      if (!clerkUserId) {
        throw new Error("No se pudo obtener el ID de Clerk del usuario");
      }
      
      // Guardar el token y marcar como activada
      setToken(token);
      setSessionActivated(true);
      
      // Actualizar el usuario con el idClerk
      if (user && !user.idClerk) {
        setUser({
          ...user,
          idClerk: clerkUserId,
        });
      }
      
      console.log("Sesión de Clerk activada exitosamente");
      console.log("ID de Clerk:", clerkUserId);
      
    } catch (error: any) {
      console.error("Error activando sesión de Clerk:", error);
      Alert.alert("Error", "Failed to activate authentication session");
      throw error;
    }
  };

  return { activateSession, sessionActivated };
};
