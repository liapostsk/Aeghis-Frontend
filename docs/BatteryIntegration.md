# Integración de Componentes de Batería en JourneyOverlay

## 📋 Resumen de integración

En el `JourneyOverlay` ahora estamos utilizando los componentes de batería que creamos anteriormente:

### **🔋 Componentes integrados:**

#### **1. BatteryDisplay (Header)**
```tsx
<BatteryDisplay 
  showControls={false}
  autoRefresh={true}
  refreshInterval={60000} // 1 minuto
/>
```
- **Ubicación**: Header del journey activo
- **Función**: Muestra la batería del usuario actual
- **Configuración**: Sin controles, auto-refresh cada minuto
- **Escalado**: Reducido al 80% para que quepa en el header

#### **2. GroupBatteryDisplay (Sección dedicada)**
```tsx
<GroupBatteryDisplay 
  userIds={selectedGroupJourney.group.membersIds.map(String)} 
/>
```
- **Ubicación**: Entre la info del journey y la lista detallada
- **Función**: Resumen de batería de todos los participantes
- **Datos**: IDs de miembros del grupo convertidos a string

#### **3. CompactBatteryIndicator (Lista de participantes)**
```tsx
<CompactBatteryIndicator 
  level={participant.batteryLevel} 
  userId={participant.user.id.toString()} 
/>
```
- **Ubicación**: Dentro de cada tarjeta de participante
- **Función**: Indicador compacto individual
- **Datos**: Nivel de batería del participante específico

### **🔄 Flujo de datos:**

```
Firebase (Firestore) 
    ↓
getMultipleUsersBatteryInfo()
    ↓
participantsStatus (state local)
    ↓
CompactBatteryIndicator (individual)

Firebase (Firestore)
    ↓  
BatteryDisplay (usuario actual)
    ↓
Header

Firebase (Firestore)
    ↓
GroupBatteryDisplay (todos)
    ↓
Sección resumen
```

### **⏰ Actualizaciones automáticas:**

1. **BatteryDisplay**: Cada 60 segundos (configurable)
2. **GroupBatteryDisplay**: Según su configuración interna (30s por defecto)
3. **Participantes individuales**: Cada 30 segundos (useEffect del JourneyOverlay)
4. **Botón refresh manual**: Actualiza participantsStatus inmediatamente

### **🎯 Beneficios de la integración:**

✅ **Reutilización de código**: Aprovechamos componentes ya creados
✅ **Consistencia visual**: Todos los indicadores usan la misma lógica de colores
✅ **Actualizaciones automáticas**: Cada componente maneja su propio refresh
✅ **Redundancia positiva**: Múltiples vistas de la misma información
✅ **Experiencia completa**: Vista individual, grupal y personal

### **📱 Layout visual:**

```
┌─────────────────────────────────────┐
│ [🔘] Trayecto Activo  [🔋85%] [🔄] [⬇] │ ← BatteryDisplay (header)
├─────────────────────────────────────┤
│ Grupo - En progreso                 │
│ [▶ Iniciar Trayecto]                │
├─────────────────────────────────────┤
│ 📊 Nivel de batería del grupo       │ ← GroupBatteryDisplay
│ Usuario 1: 85% 🟢                   │
│ Usuario 2: 42% 🟡                   │
│ Usuario 3: 15% 🔴                   │
├─────────────────────────────────────┤
│ 👤 Usuario 1    [🔋85%] [📶Online]  │ ← CompactBatteryIndicator
│ 👤 Usuario 2    [🔋42%] [📶Offline] │
│ 👤 Usuario 3    [🔋15%] [📶Online]  │
└─────────────────────────────────────┘
```

### **🔧 Configuraciones actuales:**

| Componente | Intervalo | Auto-refresh | Controles |
|------------|-----------|--------------|-----------|
| BatteryDisplay | 60s | ✅ | ❌ |
| GroupBatteryDisplay | 30s | ✅ | ❌ |
| CompactBatteryIndicator | Manual | ❌ | ❌ |
| participantsStatus | 30s | ✅ | ✅ (botón) |

### **🚀 Próximas mejoras:**

1. **Unificar intervalos** para optimizar llamadas a Firebase
2. **Cache inteligente** para evitar requests duplicados
3. **Notificaciones push** desde GroupBatteryDisplay
4. **Configuración de usuario** para intervalos de actualización
5. **Modo offline** con última información conocida

### **💡 Notas técnicas:**

- Los componentes de batería manejan sus propios errores
- Fallback a datos mockeados si Firebase falla
- Alertas automáticas para batería crítica (≤15%)
- Estilos consistentes entre todos los indicadores
- TypeScript tipado para mejor desarrollo