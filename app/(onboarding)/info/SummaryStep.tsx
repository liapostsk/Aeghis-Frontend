import React from 'react';
import { View, Text, Button, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '../../../lib/storage/useUserStorage';
import { useTokenStore } from '../../../lib/auth/tokenStore';
import { mapUserToDto } from '../../../api/user/mapper';
import { createUser } from '../../../api/user/userApi';
import { Alert } from 'react-native';

export default function SummaryStep({onBack}: { onBack: () => void }) {

  const { user, setUser } = useUserStore();
  const token = useTokenStore((state) => state.token);

  const handleCreateUser = async () => {
    try {
      if (!user) {
        Alert.alert("Error", "No hay datos de usuario disponibles.");
        return;
      }
      const dto = mapUserToDto(user);
      const userId = await createUser(dto);
      console.log("User created with ID:", userId);
      // Step 4: Update local user state
      setUser({
        ...user,
        id: userId,
      });
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Failed to create user:", error);
      Alert.alert("Error", "No se pudo crear el usuario. Intenta de nuevo.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You're All Set!</Text>
      <Text style={styles.text}>All your settings are configured. Enjoy the app 🎉</Text>
      <Button title="Go to Dashboard" onPress={handleCreateUser} />
      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>Atrás</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  text: { fontSize: 16, marginBottom: 40 },
  backButton: {
    backgroundColor: '#95a5a6',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
