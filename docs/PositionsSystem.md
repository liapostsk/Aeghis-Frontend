# Sistema de Posiciones en Tiempo Real

## 🎯 Resumen

El sistema de posiciones permite rastrear y mostrar las ubicaciones en tiempo real de todos los participantes de un journey en Firebase.

## 🏗️ Arquitectura

### Estructura de Firebase
```
/chats/{chatId}/journeys/{journeyId}/participants/{userId}/positions/{positionId}
```

### Datos Almacenados
```typescript
interface Position {
  latitude: number;
  longitude: number;
  timestamp: any; // Firebase Timestamp
}
```

## 📁 Archivos Principales

### 1. `api/firebase/journey/positionsService.ts`
Servicio principal para operaciones CRUD de posiciones.

**Funciones principales:**
- `addUserPosition()` - Añadir nueva posición
- `getLatestUserPosition()` - Obtener última posición
- `subscribeToUserPositions()` - Listener tiempo real
- `subscribeToAllParticipantsPositions()` - Listener todos los participantes
- `cleanOldPositions()` - Limpieza de datos antiguos

### 2. `lib/hooks/usePositions.ts`
Hooks de React para integración fácil en componentes.

**Hooks disponibles:**
- `useUserPositions()` - Posiciones de un usuario específico
- `useAllParticipantsPositions()` - Posiciones de todos los participantes
- `usePositionTracking()` - Tracking automático con geolocalización

### 3. `components/journey/JourneyPositions.tsx`
Componente de ejemplo que muestra el uso completo del sistema.

## 🚀 Uso Básico

### 1. Tracking Automático
```typescript
const { isTracking, startTracking, stopTracking } = usePositionTracking(
  chatId, 
  journeyId, 
  userId, 
  {
    enabled: true,
    intervalMs: 30000, // Cada 30 segundos
    highAccuracy: true
  }
);
```

### 2. Escuchar Posiciones en Tiempo Real
```typescript
const { positions, latestPosition, loading } = useUserPositions(
  chatId, 
  journeyId, 
  userId
);
```

### 3. Ver Todos los Participantes
```typescript
const { positionsMap, getLatestPositions } = useAllParticipantsPositions(
  chatId, 
  journeyId, 
  participantUserIds
);
```

## 🔧 Funcionalidades Avanzadas

### Cálculo de Distancias
```typescript
import { calculateDistance } from '../api/firebase/journey/positionsService';

const distance = calculateDistance(position1, position2); // en metros
```

### Limpieza Automática
```typescript
// Mantener solo las últimas 100 posiciones
await cleanOldPositions(chatId, journeyId, userId, 100);
```

### Verificar Posiciones Recientes
```typescript
const hasRecent = await hasRecentPosition(chatId, journeyId, userId, 5); // últimos 5 minutos
```

## 📱 Integración en Journey

### En el Componente del Journey
```typescript
import JourneyPositions from '../components/journey/JourneyPositions';

<JourneyPositions
  chatId={chatId}
  journeyId={journeyId}
  participantUserIds={participantIds}
  isJourneyActive={journey.state === 'ACTIVE'}
/>
```

### En el Mapa
```typescript
const { positionsMap } = useAllParticipantsPositions(chatId, journeyId, participantIds);

// Mostrar marcadores en el mapa
positionsMap.forEach((positions, userId) => {
  const latestPos = positions[0];
  if (latestPos) {
    // Añadir marcador al mapa
  }
});
```

## ⚡ Optimizaciones

### 1. Limitación de Datos
- Por defecto se almacenan las últimas 10 posiciones por usuario
- Usar `cleanOldPositions()` periódicamente para mantener DB limpia

### 2. Frecuencia de Tracking
- **Desarrollo**: 30 segundos
- **Producción**: 15-60 segundos según batería
- **Emergencia**: 5-10 segundos

### 3. Precisión GPS
- `highAccuracy: true` para journeys importantes
- `highAccuracy: false` para ahorrar batería

## 🔒 Consideraciones de Seguridad

### Reglas de Firestore
```javascript
// Solo los participantes del journey pueden:
// - Escribir sus propias posiciones
// - Leer posiciones de otros participantes

match /chats/{chatId}/journeys/{journeyId}/participants/{userId}/positions/{positionId} {
  allow read: if isParticipant(chatId, journeyId);
  allow write: if request.auth.uid == userId && isParticipant(chatId, journeyId);
}
```

### Privacidad
- Las posiciones se eliminan cuando el journey termina
- Solo los participantes activos pueden ver las ubicaciones
- Opción para desactivar tracking individualmente

## 🐛 Manejo de Errores

### Errores Comunes
1. **Permisos de geolocalización negados**
   - Mostrar mensaje al usuario
   - Permitir añadir posición manualmente

2. **Conectividad intermitente**
   - Las posiciones se guardan localmente
   - Se sincronizan cuando hay conexión

3. **Precisión GPS baja**
   - Filtrar posiciones con accuracy > 100m
   - Mostrar indicador de precisión al usuario

## 📊 Métricas y Monitoreo

### Datos Útiles
- Número de posiciones por participante
- Tiempo promedio entre actualizaciones
- Precisión GPS promedio
- Distancias recorridas

### Analytics
```typescript
// Ejemplo de tracking de métricas
const trackPositionMetrics = (userId: string, accuracy: number) => {
  analytics.track('position_sent', {
    userId,
    accuracy,
    timestamp: new Date().toISOString()
  });
};
```

## 🔄 Flujo Completo

1. **Inicio del Journey**
   - Activar tracking automático
   - Solicitar permisos de ubicación
   - Comenzar listeners en tiempo real

2. **Durante el Journey**
   - Enviar posiciones cada X segundos
   - Actualizar mapa en tiempo real
   - Calcular distancias entre participantes

3. **Fin del Journey**
   - Detener tracking
   - Limpiar listeners
   - Opcionalmente eliminar posiciones antiguas

## 🎯 Próximas Mejoras

- [ ] Geofencing para destinos
- [ ] Alertas de proximidad
- [ ] Historial de rutas completas
- [ ] Exportar rutas a GPX
- [ ] Optimización de batería inteligente