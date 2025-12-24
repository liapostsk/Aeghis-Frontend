import { useAuth } from "@clerk/clerk-expo";
import { router, Stack } from "expo-router";
import { Pressable } from "react-native";
import Icon from '@expo/vector-icons/Ionicons';


export default function OnboardingLayout() {
  const { isLoaded } = useAuth();
    
  // Esperamos a que Clerk cargue
  if (!isLoaded) return null;

  return (
    <Stack>
      <Stack.Screen 
        name="index"
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Icon name="arrow-back" size={24} color="#FFFF" />
            </Pressable>
          ),
          headerShown: true,
          title: "",
          headerTransparent: true,
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="name"
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Icon name="arrow-back" size={24} color="#FFFF" />
            </Pressable>
          ),
          headerShown: true,
          title: "",
          headerTransparent: true,
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="phone"
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Icon name="arrow-back" size={24} color="#FFFF" />
            </Pressable>
          ),
          headerShown: true,
          title: "",
          headerTransparent: true,
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="phoneVerification"
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Icon name="arrow-back" size={24} color="#FFFF" />
            </Pressable>
          ),
          headerShown: true,
          title: "",
          headerTransparent: true,
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="email"
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Icon name="arrow-back" size={24} color="#FFFF" />
            </Pressable>
          ),
          headerShown: true,
          title: "",
          headerTransparent: true,
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="emailVerification"
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Icon name="arrow-back" size={24} color="#FFFF" />
            </Pressable>
          ),
          headerShown: true,
          title: "",
          headerTransparent: true,
          headerTintColor: '#fff',
        }}
      />
    </Stack>
  );
}
