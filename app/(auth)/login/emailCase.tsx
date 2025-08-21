import React, { useState, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  View,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import VerificationCodeField from '@/components/ui/VerificationCodeField';
import { getCurrentUser } from '@/api/user/userApi';
import { useUserStore } from '@/lib/storage/useUserStorage';
import { useTokenStore } from '@/lib/auth/tokenStore';

export default function EmailCaseScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { setUser } = useUserStore();
  const setToken = useTokenStore((state) => state.setToken);
  const { signOut, getToken } = useAuth();

  const dismissKeyboard = () => Keyboard.dismiss();

  const handleEmailChange = (text: string) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValid(emailRegex.test(text));
  };

  const handleSendCode = async () => {
    if (!signIn || !isValid) return;

    try {
      setIsLoading(true);
      const clearEmail = email.trim().toLowerCase();

      await signIn.create({ identifier: clearEmail });

      const emailFactor = signIn.supportedFirstFactors?.find(
        (f) => f.strategy === 'email_code'
      );

      if (!emailFactor || !('emailAddressId' in emailFactor)) {
        Alert.alert("Error", "Email ID not found.");
        return;
      }


      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailFactor.emailAddressId,
      });

      setCodeSent(true);
      setTimer(60);
      setCanResend(false);
      setCode('');
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
        strategy: 'email_code',
        code,
      });

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });

        const token = await getToken();
        if (!token) {
          Alert.alert("Error", "No token received from Clerk.");
          return;
        }

        setToken(token);

        const userData = await getCurrentUser();
        if (!userData || !userData.id) {
          Alert.alert("Error", "Could not retrieve your user data.");
          await signOut();
          return;
        }

        setUser(userData);
        router.push('/(tabs)');
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

  useEffect(() => {
    if (!codeSent || timer <= 0) return;

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev === 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [codeSent, timer]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Welcome back, we missed you! 👋</Text>
            </View>

            {!codeSent ? (
              <View style={styles.contentContainer}>
                <Text style={styles.instruction}>
                  Enter your email address to receive a verification code.
                </Text>
                <View style={styles.inputSection}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#7A33CC80"
                    value={email}
                    onChangeText={handleEmailChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="done"
                    onSubmitEditing={dismissKeyboard}
                  />
                </View>

                <View style={styles.buttonContainer}>
                  <Pressable
                    onPress={handleSendCode}
                    style={[styles.continueButton, !isValid && styles.disabledButton]}
                    disabled={!isValid}
                  >
                    <Text style={styles.continueButtonText}>Send Code</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.verificationContainer}>
                <Text style={styles.subtitle}>
                  We've sent a 6-digit code to {email}
                </Text>
                <Text style={styles.helpText}>Please check your inbox 📧</Text>

                <View style={styles.codeFieldContainer}>
                  <VerificationCodeField value={code} setValue={setCode} />
                </View>

                <Pressable
                  style={[
                    styles.verifyButton,
                    (isLoading || code.length !== 6) && styles.verifyButtonDisabled,
                  ]}
                  onPress={handleVerifyCode}
                  disabled={isLoading || code.length !== 6}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#7A33CC" />
                  ) : (
                    <Text style={styles.verifyButtonText}>Verify Code</Text>
                  )}
                </Pressable>

                <View style={styles.resendSection}>
                  {canResend ? (
                    <Pressable onPress={handleSendCode} style={styles.resendButton}>
                      <Text style={styles.resendText}>Resend code</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.timerText}>
                      Resend available in {timer}s
                    </Text>
                  )}
                </View>

                <View style={styles.changeSection}>
                  <Text style={styles.wrongText}>Wrong email?</Text>
                  <Pressable onPress={() => setCodeSent(false)}>
                    <Text style={styles.changeText}>Change it here</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#7A33CC" },
  keyboardAvoid: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  titleContainer: {
    marginBottom: 30,
  },
  instruction: {
    color: "#FFFFFF",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  contentContainer: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 44,
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
  inputSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  continueButton: {
    width: 300,
    height: 55,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledButton: { 
    opacity: 0.5 
  },
  continueButtonText: {
    color: "#7A33CC",
    fontSize: 18,
    fontWeight: "bold",
  },
  verificationContainer: {
    width: "100%",
    alignItems: "center",
  },
  subtitle: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 8,
  },
  helpText: {
    color: "#E8D5FF",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  codeFieldContainer: {
    marginBottom: 10,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
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
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  buttonContainer: {
    alignItems: 'center',
    paddingBottom: 60,
  },
  verifyButtonText: {
    color: "#7A33CC",
    fontSize: 18,
    fontWeight: "bold",
  },
  resendSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  timerText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontStyle: 'italic',
  },
  changeSection: {
    alignItems: 'center',
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    width: '80%',
  },
  wrongText: {
    color: '#E8D5FF',
    fontSize: 14,
    marginBottom: 5,
  },
  changeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: "underline",
  },
});
