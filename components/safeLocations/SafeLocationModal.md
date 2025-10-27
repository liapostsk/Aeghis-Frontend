# SafeLocationModal - Documentación de Uso

El `SafeLocationModal` ha sido actualizado para aceptar tanto `Location` como `SafeLocation`, lo que le da mayor flexibilidad.

## Tipos Soportados

```typescript
// Tipo unión que acepta tanto Location como SafeLocation
type SelectableLocation = SafeLocation | (LocationType & { 
  name?: string; 
  address?: string; 
  type?: string; 
  distance?: string; 
  externalId?: string; 
});
```

## Props

```typescript
interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: SelectableLocation) => void;
  title?: string; // Título opcional
  acceptLocationTypes?: 'safe' | 'all'; // Nuevo prop para controlar qué tipos acepta
}
```

## Ejemplos de Uso

### 1. Solo SafeLocations (comportamiento por defecto)
```tsx
<SafeLocationModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  onSelectLocation={(location) => {
    // location será SafeLocation
    console.log('SafeLocation seleccionada:', location.name);
  }}
  title="Seleccionar lugar seguro"
  // acceptLocationTypes="safe" // Valor por defecto
/>
```

### 2. Aceptar tanto SafeLocation como Location
```tsx
<SafeLocationModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  onSelectLocation={(location) => {
    // location puede ser SafeLocation o Location convertida
    if ('name' in location) {
      console.log('SafeLocation:', location.name);
    } else {
      console.log('Location convertida:', location.latitude, location.longitude);
    }
  }}
  title="Seleccionar cualquier ubicación"
  acceptLocationTypes="all"
/>
```

### 3. Uso en componente con manejo de tipos
```tsx
const handleSelectDestination = (location: SafeLocation | Location) => {
  // Convertir Location a SafeLocation si es necesario
  const safeLocation: SafeLocation = 'name' in location ? location : {
    id: location.id,
    name: `Ubicación personalizada`,
    address: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
    type: 'custom',
    latitude: location.latitude,
    longitude: location.longitude,
    externalId: undefined
  };
  
  setSelectedDestination(safeLocation);
};
```

## Funcionalidades

### Conversión Automática
- Cuando `acceptLocationTypes="all"`, las Location básicas se convierten automáticamente a SelectableLocation
- Se añaden campos `name`, `address`, `type` por defecto para las Location básicas

### Visualización
- SafeLocation: Se muestra con nombre, dirección y tipo de lugar
- Location convertida: Se muestra con coordenadas como nombre y "Coordenadas personalizadas" como dirección

### Selección
- SafeLocation con externalId: Se obtienen detalles completos via Google Places API
- Location o SafeLocation sin externalId: Se selecciona directamente

## Helper Functions

```typescript
// Verificar si es SafeLocation
const isSafeLocation = (location: SelectableLocation): location is SafeLocation => {
  return 'name' in location && 'address' in location && 'type' in location;
};

// Convertir Location a SelectableLocation
const locationToSelectableLocation = (
  location: LocationType, 
  name?: string, 
  address?: string
): SelectableLocation => {
  return {
    ...location,
    name: name || `Ubicación (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`,
    address: address || 'Coordenadas personalizadas',
    type: 'custom',
    distance: undefined,
    externalId: undefined,
  };
};
```

## Casos de Uso

1. **Journey Creation**: Permitir seleccionar tanto lugares seguros como ubicaciones personalizadas
2. **Emergency Contacts**: Solo lugares seguros para contactos de emergencia
3. **Route Planning**: Cualquier tipo de ubicación para planificar rutas
4. **Custom Locations**: Permitir ubicaciones personalizadas junto con lugares seguros