// app/layout.tsx
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Slot } from 'expo-router';
import TokenProvider from '@/components/auth/tokenProvider';

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <TokenProvider>
        <Slot />
      </TokenProvider>
    </ClerkProvider>
  );
}
