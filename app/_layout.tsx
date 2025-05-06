// app/layout.tsx
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { UserProvider } from "../context/UserContext";
import { Slot } from "expo-router";
import TokenProvider from '@/components/auth/tokenProvider';

// Este layout se encarga de envolver todo
export default function RootLayout() {
  
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <TokenProvider>
        <UserProvider>
          <Slot /> 
        </UserProvider>
      </TokenProvider>
    </ClerkProvider>
  );
}
