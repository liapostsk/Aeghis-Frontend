import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function InfoFormLayout() {
  const router = useRouter();

  // Prevenir navegación hacia atrás accidental durante el onboarding
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          "¿Salir del registro?",
          "Si sales ahora, perderás el progreso de configuración de tu perfil.",
          [
            {
              text: "Cancelar",
              style: "cancel",
            },
            {
              text: "Salir",
              style: "destructive", 
              onPress: () => {
                router.replace('/(auth)');
              },
            },
          ]
        );
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [router])
  );

  return (
    <>
      <StatusBar style="light" backgroundColor="#7A33CC" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { 
            backgroundColor: '#7A33CC' 
          },
          animation: 'slide_from_right',
          gestureEnabled: false,
        }}
      > 
        {/* Pantalla principal del flujo de información */}
        <Stack.Screen 
          name="index" 
          options={{
            title: 'Configuración de Perfil',
            // Punto de entrada principal - siempre disponible
          }} 
        />
        
        {/* Pasos individuales - Solo accesibles en contexto del flujo */}
        <Stack.Screen 
          name="PrivacyStep" 
          options={{
            title: 'Política de Privacidad',
            presentation: 'card',
            animationDuration: 200,
          }} 
        />
        
        <Stack.Screen 
          name="ProfileImageStep" 
          options={{
            title: 'Foto de Perfil',
            presentation: 'card',
            animationDuration: 200,
          }} 
        />
        
        <Stack.Screen 
          name="EmergencyContactStep" 
          options={{
            title: 'Contacto de Emergencia',
            presentation: 'card',
            animationDuration: 200,
          }} 
        />
        
        <Stack.Screen 
          name="SafeLocationStep" 
          options={{
            title: 'Ubicación Segura',
            presentation: 'card',
            animationDuration: 200,
          }} 
        />
        
        <Stack.Screen 
          name="SummaryStep" 
          options={{
            title: 'Completar Registro',
            presentation: 'card',
            animationDuration: 200,
            // Paso final - después de aquí va a la app principal
          }} 
        />
      </Stack>
    </>
  );
}