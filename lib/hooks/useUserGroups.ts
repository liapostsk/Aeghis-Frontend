import { useState, useEffect, useCallback } from 'react';
import { getUserGroups } from '@/api/backend/group/groupApi';
import { Group } from '@/api/backend/group/groupType';
import { useUserStore } from '@/lib/storage/useUserStorage';

// ✅ Caché global para evitar llamadas duplicadas
let cachedGroups: Group[] | null = null;
let lastFetch: number = 0;
let activePromise: Promise<Group[]> | null = null;
const CACHE_DURATION = 30000; // 30 segundos

/**
 * Hook para gestionar grupos de usuario con caché compartido
 * Evita múltiples llamadas simultáneas al backend
 */
export function useUserGroups() {
  const [groups, setGroups] = useState<Group[]>(cachedGroups || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const user = useUserStore((state) => state.user);

  const fetchGroups = useCallback(async (forceRefresh = false) => {
    // ✅ Si hay una petición activa, esperar a que termine (evita duplicados)
    if (activePromise && !forceRefresh) {
      console.log('⏳ [useUserGroups] Ya hay una carga en progreso, esperando...');
      try {
        const result = await activePromise;
        setGroups(result);
        return result;
      } catch (err) {
        setError(err as Error);
        return [];
      }
    }

    // ✅ Si hay caché válido y no es forzado, usar caché
    const now = Date.now();
    if (!forceRefresh && cachedGroups && (now - lastFetch) < CACHE_DURATION) {
      console.log('📦 [useUserGroups] Usando grupos cacheados:', cachedGroups.length);
      setGroups(cachedGroups);
      return cachedGroups;
    }

    if (!user?.id) {
      console.warn('⚠️ [useUserGroups] No hay usuario logueado');
      return [];
    }

    setLoading(true);
    setError(null);

    // ✅ Crear promesa única compartida
    activePromise = getUserGroups();

    try {
      console.log('🔄 [useUserGroups] Cargando grupos del backend...');
      const userGroups = await activePromise;
      
      // ✅ Actualizar caché
      cachedGroups = userGroups;
      lastFetch = Date.now();
      
      setGroups(userGroups);
      console.log(`✅ [useUserGroups] ${userGroups.length} grupos cargados`);
      
      return userGroups;
    } catch (err) {
      console.error('❌ [useUserGroups] Error cargando grupos:', err);
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
      activePromise = null;
    }
  }, [user?.id]);

  // ✅ Cargar al montar (solo si no hay caché válido)
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // ✅ Función para forzar recarga
  const refresh = useCallback(() => {
    console.log('🔄 [useUserGroups] Forzando recarga de grupos...');
    return fetchGroups(true);
  }, [fetchGroups]);

  // ✅ Función para limpiar caché
  const clearCache = useCallback(() => {
    console.log('🗑️ [useUserGroups] Limpiando caché de grupos');
    cachedGroups = null;
    lastFetch = 0;
  }, []);

  return {
    groups,
    loading,
    error,
    refresh,
    clearCache,
  };
}

/**
 * Función global para invalidar caché
 * Usar después de crear/editar/eliminar/salir de un grupo
 */
export function invalidateGroupsCache() {
  console.log('🗑️ [useUserGroups] Invalidando caché global de grupos');
  cachedGroups = null;
  lastFetch = 0;
  activePromise = null;
}
