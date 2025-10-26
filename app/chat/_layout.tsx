import { useAuth } from "@clerk/clerk-expo";
import { Stack } from "expo-router";
import React from "react";

export default function ChatLayout() {
  const { isLoaded } = useAuth();
    
  // Esperamos a que Clerk cargue
  if (!isLoaded) return null;

  return (
    <Stack>
      <Stack.Screen 
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="chatInfo"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="journey"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}