import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput
} from 'react-native';
import { useUserStore } from "../../lib/storage/useUserStorage";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import { useSignUp } from '@clerk/clerk-expo';

export default function PhoneScreen() {
  const { user, setUser } = useUserStore();
  const router = useRouter();
  const [isValid, setIsValid] = useState(false);
  const [email, setEmail] = useState('');

  const { signUp } = useSignUp();

  // Maneja el valor de la entrada del email
  const handleEmailChange = (text: string) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValid(emailRegex.test(text));  // Valida el email mientras el usuario escribe.
  };

  // Función para enviar el código de verificación
  const sendCode = async () => {
    if (!signUp) return;

    // Formatea y valida el correo electrónico
    const clearEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clearEmail)) {
      setIsValid(false);
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    setIsValid(true);

    try {
      // 1. Actualizamos el correo electrónico en el objeto de signUp
      // Esto es necesario para que Clerk reconozca el correo electrónico
      // El phone number ya debería estar en el objeto de signUp
      // y no es necesario actualizarlo aquí.
      await signUp.update({
        emailAddress: email,
      });

      // 2. Pedir que Clerk envíe el código de verificación
      await signUp.prepareEmailAddressVerification();

      // 3. Guardamos el correo electrónico para usarlo más tarde
      setUser({ ...user, email: clearEmail });

      // 4. Navegamos a la siguiente pantalla
      router.push("/(onboarding)/emailVerification");
    } catch (error: any) {
      console.error("Error sending verification code:", error);
      Alert.alert("Error", error?.errors?.[0]?.message || "Failed to send verification code.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.textTitle}>
        Hey {user?.name}, let's{"\n"}verify your email!
      </Text>

      <Text style={styles.instruction}>
        Enter your email address to receive a verification code.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        placeholderTextColor="#7A33CC"
        value={email}
        onChangeText={handleEmailChange}  // Usa el manejador de cambio de texto
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        returnKeyType="done"
      />

      <Pressable
        onPress={sendCode}
        style={[styles.continueButton, !isValid && styles.disabledButton]}
        disabled={!isValid}
      >
        <Text style={styles.continueButtonText}>Send Code</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#7A33CC",
    paddingBottom: 70,
  },
  textTitle: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "bold",
    position: "absolute",
    top: "15%",
    textAlign: "center",
  },
  instruction: {
    color: "#FFFFFF",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: 300,
    height: 50,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  continueButton: {
    width: 300,
    height: 55,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: "25%",
  },
  disabledButton: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: "#7A33CC",
    fontSize: 18,
    fontWeight: "bold",
  },
});
