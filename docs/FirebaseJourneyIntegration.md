# Integración Firebase Journey System

## 🎯 Resumen

Sistema integrado que mantiene sincronizados los journeys entre el backend (PostgreSQL) y Firebase para funcionalidades en tiempo real como posiciones GPS y estados de participación.

## 🏗️ Arquitectura Dual

### Backend (PostgreSQL)
- **Datos principales**: Journeys, Participaciones, Ubicaciones
- **API REST**: Operaciones CRUD tradicionales
- **Persistencia**: Almacenamiento permanente y consultas complejas

### Firebase (Firestore)
- **Datos en tiempo real**: Estados, posiciones GPS, notificaciones
- **Listeners**: Actualizaciones automáticas en la UI
- **Estructura anidada**: Optimizada para consultas en tiempo real

## 📁 Estructura Firebase

```
/chats/{chatId}/
├── journeys/{journeyId}/           # Documento del journey
│   └── participants/{userId}/      # Participación por usuario (Clerk UID)
│       └── positions/{positionId}  # Posiciones GPS en tiempo real
```

### Documentos de Journey
```typescript
interface JourneyDoc {
  ownerId: string;        // Clerk UID del creador
  type: JourneyType;      // individual | common_destination | personalized
  state: JourneyState;    // PENDING | IN_PROGRESS | COMPLETED | CANCELLED
  startedAt: Timestamp;   // Cuando se creó
  endedAt?: Timestamp;    // Cuando terminó (opcional)
}
```

### Documentos de Participación
```typescript
interface Participation {
  userId: string;                    // Clerk UID
  journeyId?: string;               // Redundante, implícito en la ruta
  state: ParticipationState;        // PENDING | ACCEPTED | REJECTED | etc.
  destination?: Position;           // Destino personalizado (opcional)
  backendParticipationId?: number;  // Referencia al backend
  joinedAt: Timestamp;              // Cuando se unió
  updatedAt: Timestamp;             // Última actualización
}
```

### Documentos de Posición
```typescript
interface Position {
  latitude: number;
  longitude: number;
  timestamp: Timestamp;
}
```

## 🔄 Flujo de Sincronización

### 1. Creación de Journey

```typescript
// En journey.tsx - handleCreateJourney()

// 1. Crear en Backend
const journeyId = await createJourney(journeyData);

// 2. Crear en Firebase
await createJourneyInChat(chatId, { ...journeyData, id: journeyId });

// 3. Crear participación del creador en Backend
const participationId = await createParticipation(participationData);

// 4. Crear participación en Firebase
await joinJourneyParticipation(chatId, journeyId.toString(), {
  destination: destinationPosition,
  backendParticipationId: participationId,
  initialState: 'ACCEPTED'
});

// 5. Añadir posición inicial
await addUserPosition(chatId, journeyId.toString(), userUID, lat, lng);
```

### 2. Unirse a Journey

```typescript
// En JoinJourneyModal.tsx - handleJoinJourney()

// 1. Crear participación en Backend
const participationId = await createParticipation(participationData);

// 2. Actualizar journey en Backend
await updateJourney(updatedJourney);

// 3. Sincronizar con Firebase
await joinJourneyParticipation(chatId, journeyId.toString(), {
  destination: destinationPosition,
  backendParticipationId: participationId,
  initialState: 'ACCEPTED'
});

// 4. Añadir posición inicial
await addUserPosition(chatId, journeyId.toString(), userUID, lat, lng);
```

## 🚀 Servicios Disponibles

### 1. `journeyService.ts`
- `createJourneyInChat()` - Crear journey en Firebase
- `getJourneysByChat()` - Obtener journeys de un chat
- `onJourneysSnapshot()` - Listener en tiempo real
- `updateJourneyState()` - Cambiar estado del journey
- `deleteJourney()` - Eliminar journey

### 2. `participationsService.ts`
- `joinJourneyParticipation()` - Unirse a journey
- `setParticipationState()` - Cambiar estado de participación
- `getJourneyParticipations()` - Obtener todas las participaciones
- `getUserParticipation()` - Obtener participación específica
- `isUserParticipating()` - Verificar si usuario participa
- `getParticipantsCount()` - Contar participantes

### 3. `positionsService.ts`
- `addUserPosition()` - Añadir nueva posición GPS
- `getLatestUserPosition()` - Última posición del usuario
- `subscribeToUserPositions()` - Listener posiciones usuario
- `subscribeToAllParticipantsPositions()` - Listener todos los participantes
- `cleanOldPositions()` - Limpieza de datos antiguos
- `calculateDistance()` - Calcular distancia entre posiciones

### 4. `syncService.ts`
- `syncJourneyToFirebase()` - Sincronizar journey individual
- `syncParticipationToFirebase()` - Sincronizar participación
- `syncCompleteJourneyToFirebase()` - Sincronización completa
- `ensureActiveJourneysInFirebase()` - Verificar journeys activos

## 🎯 Casos de Uso

### Tracking en Tiempo Real
```typescript
// Hook para mostrar posiciones de todos los participantes
const { positionsMap } = useAllParticipantsPositions(
  chatId, 
  journeyId, 
  participantIds
);

// Mostrar en mapa
positionsMap.forEach((positions, userId) => {
  const latestPos = positions[0];
  if (latestPos) {
    // Actualizar marcador en el mapa
  }
});
```

### Estados de Participación
```typescript
// Listener para cambios de estado
onSnapshot(participationsRef, (snapshot) => {
  snapshot.docs.forEach(doc => {
    const participation = doc.data();
    if (participation.state === 'ACCEPTED') {
      // Usuario aceptó unirse
    }
  });
});
```

### Sincronización de Journeys Existentes
```typescript
// Al cargar la app, sincronizar journeys activos
await ensureActiveJourneysInFirebase(chatId, activeJourneys, participations);
```

## ⚡ Optimizaciones

### 1. Identificadores
- **Backend**: IDs numéricos secuenciales
- **Firebase**: Usar backend ID convertido a string como document ID
- **Usuarios**: Clerk UID para Firebase, backend ID para PostgreSQL

### 2. Datos Redundantes
- `backendParticipationId` en Firebase para referencia cruzada
- `journeyId` implícito en la ruta, opcional en documento

### 3. Limpieza Automática
- Posiciones GPS se limpian automáticamente (últimas 100)
- Journeys completados se mantienen para historial
- Listeners se cancelan automáticamente al desmontar componentes

## 🔒 Consideraciones de Seguridad

### Reglas de Firestore
```javascript
// Solo participantes pueden leer/escribir
match /chats/{chatId}/journeys/{journeyId} {
  allow read, write: if isParticipantOfChat(chatId);
  
  match /participants/{userId} {
    // Solo el usuario puede escribir sus datos
    allow write: if request.auth.uid == userId;
    allow read: if isParticipantOfChat(chatId);
    
    match /positions/{positionId} {
      allow write: if request.auth.uid == userId;
      allow read: if isParticipantOfChat(chatId);
    }
  }
}
```

### Validaciones
- Verificar que el usuario esté autenticado antes de operaciones Firebase
- Validar que el usuario sea parte del chat/grupo
- Limitar frecuencia de actualizaciones de posición

## 🐛 Manejo de Errores

### Estrategia de Resilencia
1. **Operación principal**: Backend siempre tiene prioridad
2. **Firebase como enhancement**: Si falla, no bloquea la funcionalidad básica
3. **Re-sincronización**: Verificar y sincronizar al cargar la app
4. **Fallbacks**: UI puede funcionar solo con datos del backend

### Ejemplo de Manejo
```typescript
try {
  // Operación principal en backend
  const journeyId = await createJourney(journeyData);
  
  try {
    // Enhancement con Firebase
    await createJourneyInChat(chatId, journeyData);
  } catch (firebaseError) {
    console.warn('Firebase sync failed:', firebaseError);
    // Continuar sin bloquear
  }
  
} catch (backendError) {
  // Fallar completamente si backend falla
  throw backendError;
}
```

## 📊 Monitoreo

### Métricas Útiles
- Tiempo de sincronización Backend ↔ Firebase
- Número de posiciones GPS por journey
- Frecuencia de actualizaciones en tiempo real
- Errores de sincronización

### Logging
```typescript
console.log('🔄 Sincronizando journey con Firebase');
console.log('✅ Journey sincronizado correctamente');
console.warn('⚠️ Error de sincronización no crítico');
console.error('❌ Error crítico en operación');
```

Este sistema proporciona una base sólida para funcionalidades en tiempo real manteniendo la consistencia con el backend principal.