import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  ActivityIndicator
} from 'react-native';
import { useUserStore } from "../../../lib/storage/useUserStorage";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import { useSignUp } from '@clerk/clerk-expo';
import ContinueButton from "../../../components/ui/ContinueButton";

const validateEmail = (email: string) => {
  const trimmedEmail = email.trim();
  
  if (trimmedEmail === "") {
    return { isValid: false, message: "Please enter your email address." };
  }
  
  // Regex más robusta para email
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, message: "Please enter a valid email address." };
  }
  
  if (trimmedEmail.length > 254) {
    return { isValid: false, message: "Email address is too long." };
  }
  
  return { isValid: true, message: "" };
};

export default function EmailScreen() {
  // Store y router
  const { user, setUser } = useUserStore();
  const router = useRouter();
  const { signUp } = useSignUp();

  // Estados
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Valores computados
  const validation = validateEmail(email);
  const canContinue = validation.isValid && !isLoading;

  // Event handlers
  const handleEmailChange = (text: string) => {
    setEmail(text);
  };

  const sendCode = async () => {
    if (!canContinue || !signUp) return;

    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      await signUp.update({ emailAddress: cleanEmail });
      await signUp.prepareEmailAddressVerification();
      setUser({ ...user, email: cleanEmail });
      router.push("/(onboarding)/emailVerification");
    } catch (error: any) {
      console.error("Error sending verification code:", error);
      const errorMessage = error?.errors?.[0]?.message || "Failed to send verification code.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.contentContainer}>
              <View style={styles.titleContainer}>
                <Text style={styles.textTitle}>
                  Hey {user?.name}, let's{"\n"}verify your email!
                </Text>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.instruction}>
                  Enter your email address to receive a verification code.
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    email && !validation.isValid && styles.inputError
                  ]}
                  placeholder="Enter your email address"
                  placeholderTextColor="#7A33CC80"
                  value={email}
                  onChangeText={handleEmailChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  returnKeyType="done"
                  onSubmitEditing={sendCode}
                  editable={!isLoading}
                  maxLength={254}
                />

                {email && !validation.isValid && (
                  <Text style={styles.errorText}>{validation.message}</Text>
                )}
              </View>

              <View style={styles.buttonContainer}>
                <ContinueButton
                  onPress={sendCode}
                  text={isLoading ? "Sending..." : "Send Code"}
                  disabled={!canContinue}
                  loading={isLoading}
                />
              </View>
            </View>
          </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#7A33CC",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: '100%',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  textTitle: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 44,
  },
  inputSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    bottom: "5%"
  },
  instruction: {
    color: "#FFFFFF",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  input: {
    width: 300,
    height: 60,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#000",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputError: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    alignItems: 'center',
    paddingBottom: 60,
    bottom: "5%",
  },
});