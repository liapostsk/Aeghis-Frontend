import { useState, useEffect, useCallback } from 'react';
import * as Battery from 'expo-battery';
import { 
  updateUserBatteryLevel
} from '../../api/firebase/users/userService';

/*
El hook automáticamente:
  1. Lee batería del dispositivo → valida (0-100) → actualiza estado
  2. Si autoSync=true → guarda en Firebase automáticamente  
  3. refreshBatteryLevel() → fuerza nueva lectura manual
  4. updateBatteryFromDevice() → guarda manualmente en Firebase
*/

interface UseBatteryLevelOptions {
  updateInterval?: number;  // Intervalo en milisegundos para actualizaciones automáticas
  autoSync?: boolean;       // Si debe sincronizar automáticamente con Firebase
}

interface BatteryLevelState {
  level: number | null;
  isCharging: boolean | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useBatteryLevel(options: UseBatteryLevelOptions = {}) {
  const {
    updateInterval = 60000, // 1 minuto por defecto
    autoSync = true
  } = options;

  const [batteryState, setBatteryState] = useState<BatteryLevelState>({
    level: null,
    isCharging: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  // Obtener el nivel de batería del dispositivo
  const getDeviceBatteryLevel = useCallback(async () => {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryState = await Battery.getBatteryStateAsync();
      const isCharging = batteryState === Battery.BatteryState.CHARGING;
      
      // Calcular el nivel y validar que esté entre 0 y 100
      let level = Math.round(batteryLevel * 100);
      if (level < 0 || level > 100 || isNaN(level)) {
        console.warn('Invalid battery level detected:', level, 'Setting to 0');
        level = 0;
      }
      
      console.log('Device battery level:', level, 'Charging:', isCharging);
      return {
        level,
        isCharging,
      };
    } catch (error) {
      console.error('Error getting device battery level:', error);
      throw new Error('No se pudo obtener el nivel de batería del dispositivo');
    }
  }, []);

  // Sincronizar con Firebase
  const syncWithFirebase = useCallback(async (level: number) => {
    try {
      await updateUserBatteryLevel(level);
    } catch (error) {
      console.error('Error syncing battery level with Firebase:', error);
      throw error;
    }
  }, []);

  // Actualizar el estado de la batería
  const updateBatteryState = useCallback(async () => {
    try {
      setBatteryState(prev => ({ ...prev, isLoading: true, error: null }));

      const deviceBattery = await getDeviceBatteryLevel();
      
      setBatteryState(prev => ({
        ...prev,
        level: deviceBattery.level,
        isCharging: deviceBattery.isCharging,
        lastUpdated: new Date(),
        isLoading: false,
      }));

      // Sincronizar con Firebase si está habilitado
      if (autoSync && deviceBattery.level !== null) {
        await syncWithFirebase(deviceBattery.level);
      }

      return deviceBattery.level;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setBatteryState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      throw error;
    }
  }, [getDeviceBatteryLevel, syncWithFirebase, autoSync]);

  // Forzar actualización manual
  const refreshBatteryLevel = useCallback(async () => {
    return await updateBatteryState();
  }, [updateBatteryState]);

  // Configurar actualizaciones automáticas
  useEffect(() => {
    // Actualización inicial
    updateBatteryState();

    if (autoSync && updateInterval > 0) {
      const interval = setInterval(() => {
        updateBatteryState();
      }, updateInterval);

      return () => clearInterval(interval);
    }
  }, [updateBatteryState, autoSync, updateInterval]);

  // Listener para cambios en el estado de la batería
  useEffect(() => {
    let subscription: any;

    const setupBatteryListener = async () => {
      try {
        // Solo configurar listener si está disponible
        if (Battery.addBatteryLevelListener) {
          subscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
            // Calcular el nivel y validar que esté entre 0 y 100
            let level = Math.round(batteryLevel * 100);
            if (level < 0 || level > 100 || isNaN(level)) {
              console.warn('Invalid battery level detected in listener:', level, 'Setting to 0');
              level = 0;
            }
            
            setBatteryState(prev => ({
              ...prev,
              level,
              lastUpdated: new Date(),
            }));

            // Sincronizar con Firebase si está habilitado
            if (autoSync) {
              syncWithFirebase(level).catch(console.error);
            }
          });
        }
      } catch (error) {
        console.warn('Battery listener not available:', error);
      }
    };

    setupBatteryListener();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [autoSync, syncWithFirebase]);

  return {
    ...batteryState,
    refreshBatteryLevel,
  };
}