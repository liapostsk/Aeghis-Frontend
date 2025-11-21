import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Slot, useRouter, useSegments } from 'expo-router';
import TokenProvider from '@/lib/auth/tokenProvider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NotificationProvider } from '@/api/notifications/NotificationContext';
import { useSessionState } from '@/lib/hooks/useSessionState';
import { useEffect } from 'react';
import LoadingScreen from '@/components/common/LoadingScreen';

function RootNavigator() {
  const { state } = useSessionState();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (state === 'checking') return; // Wait for validation to complete

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inAdminGroup = segments[0] === '(admin)';
    const inChatGroup = segments[0] === 'chat';

    console.log('[RootNavigator] State:', state, 'Segments:', segments);

    switch (state) {
      case 'noSession':
        if (!inAuthGroup) {
          console.log('[RootNavigator] Redirecting to auth (no session)');
          router.replace('/(auth)');
        }
        break;

      case 'needsProfile':
        // Allow navigation within auth group for infoForm
        if (!inAuthGroup) {
          console.log('[RootNavigator] Redirecting to onboarding (needs profile)');
          router.replace('/(auth)/infoForm');
        }
        break;

      case 'admin':
        // ✅ Usuario ADMIN → Redirigir a panel de admin
        if (!inAdminGroup) {
          console.log('[RootNavigator] Redirecting to admin panel (admin role)');
          router.replace('/(admin)');
        }
        break;

      case 'ready':
        // Usuario normal → Redirigir a tabs solo si NO está en tabs o chat
        if (!inTabsGroup && !inChatGroup) {
          console.log('[RootNavigator] Redirecting to tabs (ready)');
          router.replace('/(tabs)');
        }
        break;

      case 'inconsistent':
        if (!inAuthGroup) {
          console.log('[RootNavigator] Redirecting to auth (inconsistent state)');
          router.replace('/(auth)');
        }
        break;
    }
  }, [state, segments]);

  if (state === 'checking') {
    return <LoadingScreen />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ClerkProvider tokenCache={tokenCache}>
          <TokenProvider>
            <ClerkLoaded>
              <NotificationProvider>
                <RootNavigator />
              </NotificationProvider>
            </ClerkLoaded>
          </TokenProvider>
        </ClerkProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
