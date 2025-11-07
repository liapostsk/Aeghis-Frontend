import axios from "axios";
import { getAuthToken } from "@/lib/auth/tokenStore";
import { Platform } from "react-native";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL_ANDROID_SIM || process.env.EXPO_PUBLIC_API_URL_ANDROID || process.env.EXPO_PUBLIC_API_URL,
  //process.env.EXPO_PUBLIC_API_URL, --> PROD
  //process.env.EXPO_PUBLIC_API_URL_LOCAL, --> DEV
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  async (config) => {
    const token = getAuthToken();
    
    // Debug info
    console.log("📱 Platform:", Platform.OS);
    console.log("🌐 Base URL:", config.baseURL);
    console.log("📡 Request to:", config.url);
    console.log("🔗 Full URL:", `${config.baseURL}${config.url}`);
    console.log("🔐 Token:", token ? `${token.substring(0, 20)}...` : "null");
    console.log("🧾 Payload:", config.data);
    
    if (!token) {
      console.warn("⚠️ No token found, request will not include Authorization header.");
    }
    
    if (!config) {
      console.warn("⚠️ No config found, request will not include Authorization header.");
    }
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    console.log("✅ Response success:", {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  (error) => {
    // Detailed error logging
    console.error("❌ Error completo:", {
      message: error.message,
      code: error.code,
      platform: Platform.OS,
      baseURL: error.config?.baseURL,
      url: error.config?.url,
      fullURL: error.config?.url ? `${error.config.baseURL}${error.config.url}` : 'N/A',
      method: error.config?.method,
      timeout: error.config?.timeout,
      hasResponse: !!error.response,
      responseStatus: error.response?.status,
      responseData: error.response?.data,
      hasRequest: !!error.request,
      networkError: error.message === 'Network Error',
    });

    // Specific error messages for debugging
    if (error.code === 'ECONNABORTED') {
      console.error("⏱️ Request timeout - El servidor tardó más de 10 segundos");
    } else if (error.message === 'Network Error') {
      console.error("🔌 Network Error - Posibles causas:");
      console.error("  1. Backend no está corriendo");
      console.error("  2. URL incorrecta (verifica EXPO_PUBLIC_API_URL_ANDROID)");
      console.error("  3. Firewall bloqueando la conexión");
      console.error("  4. Android no permite cleartext traffic");
      console.error("  5. Dispositivo no está en la misma red");
    } else if (error.response) {
      console.error(`🚫 Server respondió con error ${error.response.status}`);
    } else if (error.request) {
      console.error("📡 Request se envió pero no hubo respuesta");
    }

    return Promise.reject(error);
  }
);

export default api;