// app/layout.tsx o app/_layout.tsx
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Slot } from 'expo-router';
import TokenProvider from '@/lib/auth/tokenProvider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PushNotificationsInitializer } from '@/api/notifications/notificationComponent';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ClerkProvider tokenCache={tokenCache}>
          <TokenProvider>
            {/* ✅ Inicializar notificaciones push */}
            <PushNotificationsInitializer />
            
            <Slot />
          </TokenProvider>
        </ClerkProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
