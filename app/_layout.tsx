import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Slot } from 'expo-router';
import TokenProvider from '@/lib/auth/tokenProvider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NotificationProvider } from '@/api/notifications/NotificationContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ClerkProvider tokenCache={tokenCache}>
          <TokenProvider>
            <ClerkLoaded>
              <NotificationProvider>
                <Slot />
              </NotificationProvider>
            </ClerkLoaded>
          </TokenProvider>
        </ClerkProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
