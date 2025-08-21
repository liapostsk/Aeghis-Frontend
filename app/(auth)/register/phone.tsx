import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import { useSignUp } from '@clerk/clerk-expo';
import ContinueButton from "../../../components/ui/ContinueButton";
import { useUserStore } from "../../../lib/storage/useUserStorage";
import PhoneNumberPicker from '@/components/ui/PhoneNumberPicker';

const validatePhoneNumber = (phone: string, countryCode: string) => {
  const cleanPhone = phone.replace(/\s/g, '');
  
  if (cleanPhone === "") {
    return { isValid: false, message: "Please enter your phone number." };
  }
  
  // Validación básica por longitud según país
  const minLength = countryCode === 'ES' ? 9 : 6;
  const maxLength = countryCode === 'ES' ? 9 : 15;
  
  if (cleanPhone.length < minLength) {
    return { isValid: false, message: `Phone number must be at least ${minLength} digits.` };
  }
  
  if (cleanPhone.length > maxLength) {
    return { isValid: false, message: `Phone number cannot exceed ${maxLength} digits.` };
  }
  
  // Regex básica para números (solo dígitos)
  const phoneRegex = /^\d+$/;
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, message: "Phone number can only contain digits." };
  }
  
  return { isValid: true, message: "" };
};

export default function PhoneScreen() {
  // Store y router
  const { user, setUser } = useUserStore();
  const router = useRouter();
  const { signUp } = useSignUp();

  // Estados
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState<'ES' | string>('ES');
  const [callingCode, setCallingCode] = useState('34');
  const [isLoading, setIsLoading] = useState(false);

  // Valores computados
  const validation = validatePhoneNumber(phone, countryCode);
  const canContinue = validation.isValid && !isLoading;

  // Event handlers
  const handlePhoneChange = (text: string) => {
    // Solo permitir números y espacios
    const formattedText = text.replace(/[^\d\s]/g, '');
    setPhone(formattedText);
  };

  const sendCode = async () => {
    if (!canContinue || !signUp) return;

    setIsLoading(true);
    const fullPhone = `+${callingCode}${phone.replace(/\s/g, '')}`;

    try {
      await signUp.create({ phoneNumber: fullPhone });
      await signUp.preparePhoneNumberVerification();
      setUser({ ...user, phone: fullPhone });
      router.push("/(onboarding)/phoneVerification");
    } catch (error: any) {
      console.error("Error sending SMS:", error);
      const errorMessage = error?.errors?.[0]?.message || "Failed to send SMS. Please try again.";
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
        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Text style={styles.textTitle}>
              Hey {user?.name || "User"}, let's{"\n"}verify your phone number!
            </Text>
          </View>

          <View style={styles.phoneContainer}>
            <PhoneNumberPicker
              onChange={({ countryCode, callingCode }) => {
                setCountryCode(countryCode);
                setCallingCode(callingCode);
              }}
            />

            <TextInput
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="number-pad"
              inputMode="numeric"
              placeholder="Phone number"
              placeholderTextColor="#aaa"
              style={[
                styles.phoneInput,
                phone && !validation.isValid && styles.phoneInputError
              ]}
              maxLength={15}
              returnKeyType="done"
              onSubmitEditing={sendCode}
              editable={!isLoading}
            />
          </View>

          {phone && !validation.isValid && (
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
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    bottom: "10%",
  },
  textTitle: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "bold",
    textAlign: 'center',
  },
  phoneContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#E3D5F5',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F1EAFD',
    padding: 12,
    fontSize: 16,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  phoneInputError: {
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    bottom: "10%",
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
});
