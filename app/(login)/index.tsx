import React, { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import PhoneNumberInput from '../../components/PhoneNumberInput';
import VerificationCodeField from '../../components/VerificationCodeField';
import ContinueButton from '../../components/ContinueButton';
import { ICountry } from 'react-native-international-phone-number';
import { getCurrentUser } from '@/api/user/userApi';

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<null | ICountry>(null);
  const [isValid, setIsValid] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fullPhone = `${selectedCountry?.callingCode}${phone.replace(/\s/g, '')}`;

  const handleSendCode = async () => {
    if (!signIn || !selectedCountry || !isValid) return;

    try {
      setIsLoading(true);

      // Iniciar el intento de login
      await signIn.create({ identifier: fullPhone });

      // Enviar código OTP
      const phoneCodeFactor = signIn.supportedFirstFactors?.find(
        (factor) => factor.strategy === 'phone_code'
      );
      
      // Asegúrate de que existe y tiene phoneNumberId
      if (!phoneCodeFactor || !('phoneNumberId' in phoneCodeFactor)) {
        Alert.alert("Error", "Phone number ID not found.");
        return;
      }
      
      await signIn.prepareFirstFactor({
        strategy: 'phone_code',
        phoneNumberId: phoneCodeFactor.phoneNumberId,
      });

      setCodeSent(true);
    } catch (error: any) {
      console.error("Send code error:", error);
      Alert.alert("Error", error?.errors?.[0]?.message || "Could not send verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!signIn || !isLoaded || code.length !== 6) return;

    try {
      setIsLoading(true);

      const attempt = await signIn.attemptFirstFactor({
        strategy: 'phone_code',
        code,
      });

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.push('/(tabs)'); // Redirige al home o dashboard
      } else {
        Alert.alert("Error", "Incomplete verification.");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      Alert.alert("Error", error?.errors?.[0]?.message || "Invalid verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome 👋</Text>

      {!codeSent ? (
        <>
          <PhoneNumberInput
            value={phone}
            onChange={(val, valid) => {
              setPhone(val);
              setIsValid(valid);
            }}
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
          />
          <ContinueButton
            onPress={handleSendCode}
            text="Send Verification Code"
            disabled={!isValid || isLoading}
          />
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>Enter the code sent to {fullPhone}</Text>
          <VerificationCodeField value={code} setValue={setCode} />
          <Pressable style={styles.verifyButton} onPress={handleVerifyCode}>
            {isLoading ? (
              <ActivityIndicator color="#7A33CC" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify</Text>
            )}
          </Pressable>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#7A33CC",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 70,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
  },
  subtitle: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  verifyButton: {
    width: 300,
    height: 55,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  verifyButtonText: {
    color: "#7A33CC",
    fontSize: 18,
    fontWeight: "bold",
  },
});
