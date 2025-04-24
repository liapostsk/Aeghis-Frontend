import { Redirect, Stack } from "expo-router";
import { useAuth } from '@clerk/clerk-expo';

export default function OnboardingLayout() {
  const { isSignedIn } = useAuth();

  // Si el usuario ya está autenticado, lo redirigimos al home
  if (isSignedIn) {
    return <Redirect href={'/'} />;
  }

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="age"
        options={{
          headerShown: true,
          title: "",
          headerTransparent: true,
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="name"
        options={{
          headerShown: true,
          title: "",
          headerTransparent: true,
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="phone"
        options={{
          headerShown: true,
          title: "",
          headerTransparent: true,
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="phoneVerification"
        options={{
          headerShown: true,
          title: "",
          headerTransparent: true,
          headerTintColor: '#fff',
        }}
      />
    </Stack>
  );
}
