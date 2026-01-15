import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Slot, useRouter, useSegments } from 'expo-router';
import TokenProvider from '@/lib/auth/tokenProvider';
import { NotificationProvider } from '@/api/notifications/NotificationContext';
import { useSessionState } from '@/lib/hooks/useSessionState';
import { useEffect, useState } from 'react';
import LoadingScreen from '@/components/common/LoadingScreen';
import { I18nextProvider } from "react-i18next";
import i18n, { initI18n } from "@/i18n/i18n";

function RootNavigator() {
  const { state } = useSessionState();
  const segments = useSegments();
  const router = useRouter();
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => {
      setI18nReady(true);
    });
  }, []);

  useEffect(() => {
    if (state === 'checking') return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inAdminGroup = segments[0] === '(admin)';
    const inChatGroup = segments[0] === 'chat';

    console.log('[RootNavigator] State:', state, 'Segments:', segments);

    switch (state) {
      case 'noSession':
        if (!inAuthGroup) {
          router.replace('/(auth)');
        }
        break;

      case 'needsProfile':
        if (!inAuthGroup) {
          router.replace('/(auth)/infoForm');
        }
        break;

      case 'admin':
        if (!inAdminGroup) {
          router.replace('/(admin)');
        }
        break;

      case 'ready':
        if (!inTabsGroup && !inChatGroup) {
          router.replace('/(tabs)');
        }
        break;

      case 'inconsistent':
        if (!inAuthGroup) {
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
    <I18nextProvider i18n={i18n}>
      <ClerkProvider tokenCache={tokenCache}>
        <TokenProvider>
          <ClerkLoaded>
            <NotificationProvider>
              <RootNavigator />
            </NotificationProvider>
          </ClerkLoaded>
        </TokenProvider>
      </ClerkProvider>
    </I18nextProvider>
  );
}