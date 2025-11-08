import axios from "axios";
import { getAuthToken } from "@/lib/auth/tokenStore";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  //process.env.EXPO_PUBLIC_API_URL, --> PROD
  //process.env.EXPO_PUBLIC_API_URL_LOCAL, --> DEV
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    const token = getAuthToken();
    console.log("Token usado en request:", token);
    console.log("📡 Request to:", config.url);
    console.log("🔐 Token:", token);
    console.log("🧾 Payload:", config.data);
    if (!token) {
      console.warn("No token found, request will not include Authorization header.");
    }
    if (!config) {
      console.warn("No config found, request will not include Authorization header.");
    }
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
