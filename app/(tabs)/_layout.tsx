import { Tabs } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons';
import React from "react";

export default function HomeLayout() {
  const { isLoaded } = useAuth();

  // Esperamos a que Clerk cargue
  if (!isLoaded) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#7A33CC', // Color para el texto e icono del tab activo
        tabBarInactiveTintColor: '#666', // Color para el texto e icono del tab inactivo
        tabBarStyle: { 
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#eee',
          position: 'absolute', // Hace que el tab bar se coloque sobre el contenido
          bottom: 0, // Lo coloca en la parte inferior
          elevation: 0, // Para Android
          shadowOpacity: 0, // Para iOS - elimina la sombra
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        // Efecto al seleccionar un tab
        tabBarItemStyle: {
          padding: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Map",
          title: "Map",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "map" : "map-outline"} size={24} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="groups"
        options={{
          tabBarLabel: "Groups",
          title: "Groups",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={24} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile/index"
        options={{
          headerShown: false,
          tabBarLabel: "Profile",
          title: "Profile",
          headerTransparent: true,
          headerTintColor: '#fff',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}