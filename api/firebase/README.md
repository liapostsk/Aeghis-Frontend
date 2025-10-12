# Firebase API Organization

Esta carpeta contiene todos los servicios y utilidades relacionados con Firebase, organizados por funcionalidad.

## 📁 Estructura

```
firebase/
├── auth/
│   └── firebase.ts          # Autenticación con Firebase
├── chat/
│   └── chatService.ts       # Servicios de chat y mensajería
├── users/
│   └── userService.ts       # Gestión de perfiles de usuario
├── types.ts                 # Tipos TypeScript para Firebase
└── README.md               # Esta documentación
```

## 🔧 Servicios Disponibles

### **Auth** (`auth/firebase.ts`)
- `linkFirebaseSession()` - Vincula sesión de Clerk con Firebase
- `unlinkFirebaseSession()` - Desvincula sesión de Firebase

### **Chat** (`chat/chatService.ts`)
- `createGroupFirebase()` - Crea chat de grupo en Firestore
- `joinGroupChatFirebase()` - Une usuario a chat de grupo
- `sendMessageFirebase()` - Envía mensaje al chat
- `markAllMessagesAsRead()` - Marca mensajes como leídos
- `getGroupTileInfo()` - Obtiene info para tiles de chat
- `getUnreadMessagesCount()` - Cuenta mensajes no leídos

### **Users** (`users/userService.ts`)
- `ensureCurrentUserProfile()` - Crea/actualiza perfil de usuario

### **Types** (`types.ts`)
- `ChatDoc` - Documento de chat en Firestore
- `MessageDoc` - Documento de mensaje
- `GroupTileInfo` - Info para mostrar en tiles de grupo

## 🗑️ Archivos Eliminados

Los siguientes archivos fueron eliminados por no estar en uso:
- `chatApi.ts` - Contenía `openOrCreateDM` no utilizado
- `chat/useMessages.ts` - Hook no utilizado
- `firebaseTypes.ts` - Renombrado a `types.ts`

## 📦 Importaciones

```typescript
// Auth
import { linkFirebaseSession } from '@/api/firebase/auth/firebase';

// Chat
import { createGroupFirebase } from '@/api/firebase/chat/chatService';

// Users  
import { ensureCurrentUserProfile } from '@/api/firebase/users/userService';

// Types
import { GroupTileInfo } from '@/api/firebase/types';
```

## 🔄 Migración Completada

✅ Archivos reorganizados por funcionalidad  
✅ Importaciones actualizadas en todo el proyecto  
✅ Archivos obsoletos eliminados  
✅ Rutas corregidas  
✅ Documentación añadida  