import { create } from "zustand";

// Se hace uso de Zustand para manejar el estado del token de autenticación
// y la autenticación del usuario en la aplicación. Esto permite un manejo
// centralizado y eficiente del estado de autenticación, facilitando la
// gestión de la sesión del usuario y la comunicación con la API.
// Zustand es una biblioteca de gestión de estado para React que permite
// crear tiendas de estado de manera sencilla y eficiente, utilizando
// un enfoque basado en hooks.

interface TokenState {
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
  sessionActivated: boolean;
  setSessionActivated: (activated: boolean) => void;
}

export const useTokenStore = create<TokenState>((set) => ({
  token: null,
  setToken: (token) => set({ token, isAuthenticated: !!token }),
  isAuthenticated: false,
  sessionActivated: false,
  setSessionActivated: (activated) => set({ sessionActivated: activated }),
}));

// Helper for non-hook contexts (e.g. Axios interceptor)
export const getAuthToken = () => useTokenStore.getState().token;
