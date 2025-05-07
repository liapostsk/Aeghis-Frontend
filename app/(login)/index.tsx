import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Pressable,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import PhoneNumberInput from '../../components/PhoneNumberInput';
import VerificationCodeField from '../../components/VerificationCodeField';
import ContinueButton from '../../components/ContinueButton';
import { ICountry } from 'react-native-international-phone-number';
import { getCurrentUser } from '@/api/user/userApi';
import { useUserStore } from '@/lib/storage/useUserStorage';
import { useTokenStore } from '@/lib/auth/tokenStore';

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<null | ICountry>(null);
  const [isValid, setIsValid] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useUserStore();
  const setToken = useTokenStore((state) => state.setToken);
  const { getToken } = useAuth();

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

        const token = await getToken();
        setToken(token);

        const userData = await getCurrentUser();
        setUser(userData);

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

  // Contenido principal que se reutiliza
  const renderContent = () => (
    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Welcome 👋</Text>

        {!codeSent ? (
          <View style={styles.inputContainer}>
            <PhoneNumberInput
              value={phone}
              onChange={(val, valid) => {
                setPhone(val);
                setIsValid(valid);
              }}
              selectedCountry={selectedCountry}
              onCountryChange={setSelectedCountry}
            />
            <View style={styles.buttonSpacing}>
              <ContinueButton
                onPress={handleSendCode}
                text="Send Verification Code"
                disabled={!isValid || isLoading}
              />
            </View>
          </View>
        ) : (
          <View style={styles.verificationContainer}>
            <Text style={styles.subtitle}>Enter the code sent to {fullPhone}</Text>
            <View style={styles.codeFieldContainer}>
              <VerificationCodeField value={code} setValue={setCode} />
            </View>
            <Pressable 
              style={styles.verifyButton} 
              onPress={handleVerifyCode}
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? (
                <ActivityIndicator color="#7A33CC" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setCodeSent(false)}>
              <Text style={styles.changeNumberText}>Change phone number</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {Platform.OS === "ios" ? (
        <KeyboardAvoidingView behavior="padding" style={styles.keyboardAvoid}>
          {renderContent()}
        </KeyboardAvoidingView>
      ) : (
        renderContent()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#7A33CC",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    alignItems: "center",
  },
  buttonSpacing: {
    marginTop: 30,
    width: "100%",
  },
  verificationContainer: {
    width: "100%",
    alignItems: "center",
  },
  subtitle: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
  },
  codeFieldContainer: {
    marginBottom: 10,
    width: "100%",
  },
  verifyButton: {
    width: "80%",
    height: 55,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  verifyButtonText: {
    color: "#7A33CC",
    fontSize: 18,
    fontWeight: "bold",
  },
  changeNumberText: {
    color: "#FFFFFF",
    textDecorationLine: "underline",
    marginTop: 20,
    fontSize: 16,
  },
});