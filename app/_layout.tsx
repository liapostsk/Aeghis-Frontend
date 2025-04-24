import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { UserProvider } from "../context/UserContext";
import { Slot } from "expo-router";

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <UserProvider>
        <Slot />
      </UserProvider>
    </ClerkProvider>
  );
}
