# Sistema de Verificación de Perfil

## 📋 Descripción

Sistema de verificación de identidad mediante fotos para acceder a grupos de acompañamiento (Companion Groups). Requiere que los usuarios proporcionen:

1. **Foto de perfil** - Desde galería o foto actual
2. **Selfie en vivo** - Tomada en el momento con la cámara frontal

## 🎯 Funcionalidades

### 1. Verificación Automática en Companion Groups
- Al entrar por primera vez a `/app/(tabs)/groups/companion`
- Si el usuario no está verificado (`user.verify === false`)
- Si el usuario no ha saltado la verificación anteriormente

### 2. Verificación Manual desde Perfil
- Banner visible en la pantalla de perfil si no está verificado
- Modal de verificación accesible desde el banner
- Badge de "Perfil Verificado" si ya completó la verificación

## 📁 Archivos Creados/Modificados

### Nuevos Componentes

#### `components/profile/ProfileVerificationScreen.tsx`
**Propósito:** Pantalla completa de verificación con UI paso a paso

**Props:**
```typescript
interface ProfileVerificationScreenProps {
  onVerificationComplete: () => void; // Callback al completar
  onSkip?: () => void;                // Callback al saltar (opcional)
}
```

**Características:**
- ✅ Selección de foto de perfil desde galería
- ✅ Captura de selfie con cámara frontal
- ✅ Validación de que ambas fotos estén presentes
- ✅ Preview de ambas imágenes
- ✅ Opción de "Verificar más tarde"
- ✅ Loading state durante el envío
- ✅ Instrucciones claras y tips de seguridad

#### `components/profile/VerificationBanner.tsx`
**Propósito:** Banner informativo en el perfil

**Props:**
```typescript
interface VerificationBannerProps {
  onPress: () => void; // Callback al presionar
}
```

**Estados:**
- 🟡 **No verificado:** Banner naranja con llamada a acción
- 🟢 **Verificado:** Badge verde de confirmación

### Archivos Modificados

#### `app/(tabs)/groups/companion.tsx`
**Cambios:**
- ✅ Importa `useUserStore` para verificar estado del usuario
- ✅ Importa `ProfileVerificationScreen`
- ✅ Usa `AsyncStorage` para recordar si saltó la verificación
- ✅ Muestra verificación automáticamente si:
  - `user.verify === false` Y
  - No hay registro de `VERIFICATION_SKIPPED_KEY`

**Flujo:**
```
Usuario entra a Companion
        ↓
¿Está verificado? ──No──→ ¿Ha saltado antes? ──No──→ Mostrar verificación
        ↓ Sí                      ↓ Sí
    Mostrar lista            Mostrar lista
```

#### `app/(tabs)/profile/index.tsx`
**Cambios:**
- ✅ Agrega `VerificationBanner` debajo del header
- ✅ Modal para `ProfileVerificationScreen`
- ✅ Estado `showVerificationModal`

## 🔄 Flujos de Usuario

### Flujo 1: Primera vez en Companion (No verificado)

```
1. Usuario toca tab "Companion"
   ↓
2. Sistema verifica: user.verify === false
   ↓
3. Muestra ProfileVerificationScreen
   ↓
4. Usuario selecciona foto de perfil
   ↓
5. Usuario toma selfie en vivo
   ↓
6. Usuario presiona "Enviar Verificación"
   ↓
7. Sistema procesa (simulado por ahora)
   ↓
8. Alert: "Verificación enviada"
   ↓
9. Cierra verificación → Muestra lista de companion groups
```

### Flujo 2: Saltar Verificación

```
1. Usuario en ProfileVerificationScreen
   ↓
2. Usuario presiona "Verificar más tarde"
   ↓
3. Sistema guarda en AsyncStorage: verification_skipped = true
   ↓
4. Cierra verificación → Muestra lista
   ↓
5. Próxima vez: NO muestra verificación (hasta que cambie)
```

### Flujo 3: Verificar desde Perfil

```
1. Usuario va a tab "Profile"
   ↓
2. Ve VerificationBanner (si no está verificado)
   ↓
3. Presiona banner
   ↓
4. Abre modal con ProfileVerificationScreen
   ↓
5. Completa verificación o cierra
```

## 🔐 Permisos Necesarios

El componente solicita automáticamente:

- **Cámara:** `expo-image-picker` - `requestCameraPermissionsAsync()`
- **Galería:** `expo-image-picker` - `requestMediaLibraryPermissionsAsync()`

## 📦 Dependencias

```json
{
  "expo-image-picker": "^15.0.0",
  "@react-native-async-storage/async-storage": "^1.23.0"
}
```

## 🎨 UI/UX

### ProfileVerificationScreen

**Secciones:**
1. **Header** - Icono de escudo + título + descripción
2. **Instrucciones** - Card con 3 pasos explicados
3. **Foto de perfil** - Card con preview o placeholder
4. **Selfie en vivo** - Card con preview o placeholder
5. **Tips** - Banner informativo sobre iluminación
6. **Acciones** - Botón principal + botón secundario (skip)
7. **Nota de privacidad** - Texto pequeño al final

**Estados visuales:**
- ⚪ **Vacío:** Border punteado gris
- 🟣 **Completado:** Border sólido morado + checkmark verde
- ⏳ **Enviando:** Loading spinner

### VerificationBanner

**Variantes:**
- 🟡 **No verificado:** Fondo amarillo, icono shield-outline, chevron derecha
- 🟢 **Verificado:** Fondo verde, icono shield-checkmark, sin chevron

## 🚀 TODOs / Próximos Pasos

### Backend Integration

```typescript
// TODO: Implementar en ProfileVerificationScreen.tsx línea ~125
const handleSubmitVerification = async () => {
  // 1. Subir imágenes a storage (Firebase/S3)
  const profileImageUrl = await uploadImage(profileImage);
  const livePhotoUrl = await uploadImage(livePhoto);
  
  // 2. Enviar a backend para verificación
  const response = await api.post('/user/verification', {
    profileImageUrl,
    livePhotoUrl,
    userId: user.id
  });
  
  // 3. Actualizar estado del usuario
  if (response.verified) {
    updateUser({ verify: true });
  }
};
```

### Mejoras Futuras

- [ ] Integrar servicio de verificación facial (AWS Rekognition, Azure Face API)
- [ ] Agregar indicador de progreso de verificación (pending, in_review, approved, rejected)
- [ ] Notificación push cuando la verificación se complete
- [ ] Historial de intentos de verificación
- [ ] Re-verificación periódica (cada 6 meses)
- [ ] Soporte para documento de identidad adicional

## 📊 Tracking de Estado

### AsyncStorage Keys

```typescript
VERIFICATION_SKIPPED_KEY = 'companion_verification_skipped'
```

**Valores:**
- `null` o no existe: Primera vez, mostrar verificación
- `"true"`: Usuario saltó, no mostrar hasta reset manual

### User Store

```typescript
user.verify: boolean
```

**Valores:**
- `false`: No verificado
- `true`: Verificado

## 🧪 Testing

### Casos de Prueba

1. **Primera vez en Companion (no verificado)**
   - ✅ Debe mostrar ProfileVerificationScreen
   - ✅ Debe permitir seleccionar foto
   - ✅ Debe permitir tomar selfie
   - ✅ Debe deshabilitar botón si falta alguna foto

2. **Saltar verificación**
   - ✅ Debe guardar en AsyncStorage
   - ✅ No debe mostrar de nuevo en próxima visita
   - ✅ Debe mostrar banner en perfil

3. **Usuario ya verificado**
   - ✅ Debe mostrar lista directamente
   - ✅ Debe mostrar badge verde en perfil
   - ✅ No debe mostrar banner de verificación

4. **Verificar desde perfil**
   - ✅ Banner debe abrir modal
   - ✅ Modal debe ser fullscreen
   - ✅ Cerrar modal debe volver al perfil

## 📸 Screenshots (Conceptuales)

```
┌─────────────────────────┐
│   🛡️ Verificación       │
│                         │
│ Para acceder a grupos   │
│ de acompañamiento...    │
│                         │
│ ┌───────────────────┐   │
│ │ 📸 Foto perfil    │   │
│ │ [Seleccionar]     │   │
│ └───────────────────┘   │
│                         │
│ ┌───────────────────┐   │
│ │ 📷 Selfie vivo    │   │
│ │ [Tomar foto]      │   │
│ └───────────────────┘   │
│                         │
│ [Enviar Verificación]   │
│ [Verificar más tarde]   │
└─────────────────────────┘
```

## 🔗 Referencias

- [Expo Image Picker Docs](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [AsyncStorage Docs](https://react-native-async-storage.github.io/async-storage/)
- [User Verification Best Practices](https://auth0.com/docs/manage-users/user-accounts/user-account-verification)
