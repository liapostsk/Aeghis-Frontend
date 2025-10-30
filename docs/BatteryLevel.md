# Battery Level Management - Documentación

Este conjunto de funciones y componentes permite gestionar el nivel de batería de los usuarios en Firebase de forma completa.

## 🎨 Componentes Actualizados

### **BatteryDisplay (Compacto)**
Ahora tiene un look minimalista y compacto, perfecto para headers y espacios reducidos.
- Diseño horizontal con ícono + porcentaje
- Fondo gris claro
- Colores dinámicos según el nivel
- Botón de refresh opcional pequeño

### **DetailedBatteryDisplay (Completo)**
Versión completa con toda la información y controles.
- Información de última actualización
- Botones de actualizar y simular
- Overlay de carga
- Más espacio y información detallada

### **GroupBatteryDisplay**
Sin cambios, mantiene su funcionalidad para múltiples usuarios.

## 🔋 Funciones Disponibles

### 1. **updateUserBatteryLevel(batteryLevel: number)**
Actualiza el nivel de batería del usuario actual en Firebase.

```typescript
import { updateUserBatteryLevel } from '../../api/firebase/users/userService';

// Actualizar batería al 85%
await updateUserBatteryLevel(85);
```

### 2. **getCurrentUserBatteryLevel(): Promise<number | null>**
Obtiene el nivel de batería del usuario actual desde Firebase.

```typescript
import { getCurrentUserBatteryLevel } from '../../api/firebase/users/userService';

const batteryLevel = await getCurrentUserBatteryLevel();
console.log(`Batería actual: ${batteryLevel}%`);
```

### 3. **getUserBatteryLevel(uid: string): Promise<number | null>**
Obtiene el nivel de batería de un usuario específico.

```typescript
import { getUserBatteryLevel } from '../../api/firebase/users/userService';

const batteryLevel = await getUserBatteryLevel('usuario123');
```

### 4. **getMultipleUsersBatteryInfo(userIds: string[])**
Obtiene información de batería de múltiples usuarios (útil para grupos).

```typescript
import { getMultipleUsersBatteryInfo } from '../../api/firebase/users/userService';

const userIds = ['user1', 'user2', 'user3'];
const batteryInfo = await getMultipleUsersBatteryInfo(userIds);
// Retorna: { user1: { batteryLevel: 85, lastSeen: ..., isOnline: true }, ... }
```

### 5. **updateBatteryLevelSilent(batteryLevel: number)**
Actualiza la batería sin modificar el campo `lastSeen`.

```typescript
import { updateBatteryLevelSilent } from '../../api/firebase/users/userService';

// Actualización silenciosa
await updateBatteryLevelSilent(70);
```

## 🎨 Componentes Disponibles

### 1. **BatteryDisplay (Compacto)**
Componente compacto para mostrar el nivel de batería.

```tsx
import BatteryDisplay from '../components/common/BatteryDisplay';

function MyComponent() {
  return (
    <BatteryDisplay 
      showControls={false}  // Sin controles para look limpio
      autoRefresh={true}
      refreshInterval={60000} // 1 minuto
    />
  );
}
```

### 1b. **DetailedBatteryDisplay (Completo)**
Versión detallada con todos los controles e información.

```tsx
import { DetailedBatteryDisplay } from '../components/common/BatteryDisplay';

function MyComponent() {
  return (
    <DetailedBatteryDisplay 
      showControls={true}
      autoRefresh={true}
      refreshInterval={30000} // 30 segundos
    />
  );
}
```

### 2. **GroupBatteryDisplay**
Componente para mostrar batería de múltiples usuarios en grupos.

```tsx
import { GroupBatteryDisplay } from '../components/common/BatteryDisplay';

function GroupScreen({ groupMembers }) {
  const userIds = groupMembers.map(member => member.id);
  
  return (
    <GroupBatteryDisplay userIds={userIds} />
  );
}
```

## 🪝 Hook Personalizado

### **useBatteryLevel(options?)**
Hook para gestionar batería de forma reactiva (requiere expo-battery).

```tsx
import { useBatteryLevel } from '../lib/hooks/useBatteryLevel';

function BatteryComponent() {
  const {
    level,
    isCharging,
    isLoading,
    error,
    lastUpdated,
    refreshBatteryLevel,
    syncWithFirebase
  } = useBatteryLevel({
    updateInterval: 60000,  // 1 minuto
    autoSync: true,         // Sync automático con Firebase
    silentUpdate: false     // Actualizar lastSeen
  });

  if (isLoading) return <Text>Cargando...</Text>;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <View>
      <Text>Batería: {level}%</Text>
      <Text>Cargando: {isCharging ? 'Sí' : 'No'}</Text>
      <Button title="Actualizar" onPress={refreshBatteryLevel} />
    </View>
  );
}
```

## 📊 Tipos TypeScript

```typescript
// En api/firebase/types.ts
export interface FirebaseUserProfile {
  batteryLevel: number | null;
  // ... otros campos
}

export interface BatteryInfo {
  level: number;        // 0-100
  isCharging?: boolean;
  timestamp: any;       // Firebase Timestamp
}

export interface UserBatteryUpdate {
  batteryLevel: number;
  lastSeen: any;        // Firebase Timestamp
}
```

## 🔄 Casos de Uso Comunes

### 1. **Monitoreo de Grupo en Tiempo Real**
```tsx
function GroupMonitoring({ groupId }) {
  const [members, setMembers] = useState([]);
  
  useEffect(() => {
    const checkBatteryLevels = async () => {
      const memberIds = members.map(m => m.id);
      const batteryInfo = await getMultipleUsersBatteryInfo(memberIds);
      
      // Alertar si alguien tiene batería baja
      Object.entries(batteryInfo).forEach(([userId, info]) => {
        if (info.batteryLevel && info.batteryLevel < 20) {
          Alert.alert(`${userId} tiene batería baja: ${info.batteryLevel}%`);
        }
      });
    };

    const interval = setInterval(checkBatteryLevels, 30000);
    return () => clearInterval(interval);
  }, [members]);
}
```

### 2. **Sincronización Automática**
```tsx
function AutoBatterySync() {
  useEffect(() => {
    const syncBattery = async () => {
      try {
        // Aquí irían las funciones de expo-battery
        // const level = await Battery.getBatteryLevelAsync();
        // await updateUserBatteryLevel(Math.round(level * 100));
      } catch (error) {
        console.error('Error syncing battery:', error);
      }
    };

    // Sync cada 5 minutos
    const interval = setInterval(syncBattery, 300000);
    return () => clearInterval(interval);
  }, []);
}
```

### 3. **Indicador Visual de Estado**
```tsx
function BatteryIndicator({ userId }) {
  const [batteryLevel, setBatteryLevel] = useState(null);

  const getBatteryColor = (level) => {
    if (level > 50) return '#22C55E';
    if (level > 20) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons 
        name="battery-half" 
        size={20} 
        color={getBatteryColor(batteryLevel)} 
      />
      <Text>{batteryLevel}%</Text>
    </View>
  );
}
```

## ⚠️ Consideraciones Importantes

1. **Validación**: Todos los niveles se validan entre 0-100
2. **Permisos**: Verificar permisos de batería en dispositivos móviles
3. **Privacidad**: El nivel de batería puede ser información sensible
4. **Performance**: Usar `updateBatteryLevelSilent` para actualizaciones frecuentes
5. **Error Handling**: Todas las funciones lanzan errores que deben ser manejados

## 🚀 Instalación de Dependencias

Para usar el hook completo, instalar:
```bash
expo install expo-battery
```