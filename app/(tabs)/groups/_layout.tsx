// app/(tabs)/groups/_layout.tsx
import { Stack } from 'expo-router';
export default function GroupsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="chat" 
        options={{ 
            headerShown: false, 
            headerTitle: 'Chat' 
          }}
        />
    </Stack>
  );
}
