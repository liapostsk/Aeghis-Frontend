import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";


export default function OnboardingLayout() {
  const { isSignedIn, isLoaded } = useAuth();
    
      // Esperamos a que Clerk cargue
      if (!isLoaded) return null;
    
    return (
        <Stack>
            <Stack.Screen 
                name="index"
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
