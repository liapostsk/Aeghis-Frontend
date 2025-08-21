import { router, Stack } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';


export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Profile',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="account"
        options={{
            headerLeft: () => (
            <Pressable onPress={() => router.push("/(tabs)/profile")}>
                <Icon name="arrow-back" size={24} color="#7A33CC" />
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