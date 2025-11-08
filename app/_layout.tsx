// app/layout.tsx o app/_layout.tsx
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

// ✅ Token cache correcto para Clerk
const createExpoTokenCache = () => {
  return {
    async getToken(key: string) {
      try {
        return await SecureStore.getItemAsync(key);
      } catch (error) {
        console.error('SecureStore get error:', error);
        return null;
      }
    },
    async saveToken(key: string, value: string) {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        console.error('SecureStore save error:', error);
      }
    },
  };
};
import { Slot } from 'expo-router';
import TokenProvider from '@/lib/auth/tokenProvider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

const tokenCache = createExpoTokenCache(); // ✅ instancia real

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ClerkProvider
          publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!} // asegúrate de pasarla
          tokenCache={tokenCache} // ✅ persistencia real en iOS/Android
        >
          <TokenProvider>
            <Slot />
          </TokenProvider>
        </ClerkProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
