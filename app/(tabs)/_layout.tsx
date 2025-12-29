import { Tabs } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from "react";
import { useUserStore } from "@/lib/storage/useUserStorage";
import { useChatNotifications } from "@/lib/hooks/useChatNotifications";
import { useTranslation } from 'react-i18next';

export default function HomeLayout() {
  const { isLoaded } = useAuth();
  const { t } = useTranslation();

  if (!isLoaded) return null;

  useChatNotifications();

  const refreshUser = useUserStore((state) => state.refreshUserFromBackend);
  
  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#7A33CC',
          tabBarInactiveTintColor: '#666',
          tabBarStyle: { 
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#eee',
            position: 'absolute',
            bottom: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          tabBarItemStyle: {
            padding: 5,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarLabel: t('tabs.map'),
            title: t('tabs.map'),
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "map" : "map-outline"} size={24} color={color} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="groups"
          options={{
            tabBarLabel: t('tabs.groups'),
            title: t('tabs.groups'),
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "people" : "people-outline"} size={24} color={color} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="profile"
          options={{
            headerShown: false,
            tabBarLabel: t('tabs.profile'),
            title: t('tabs.profile'),
            headerTransparent: true,
            headerTintColor: '#fff',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}