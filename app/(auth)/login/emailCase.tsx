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
import { useSignIn, useAuth, useUser } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import VerificationCodeField from '@/components/ui/VerificationCodeField';
import { getCurrentUser } from '@/api/backend/user/userApi';
import { useUserStore } from '@/lib/storage/useUserStorage';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { linkFirebaseSession } from '@/api/firebase/auth/firebase';
import { ensureCurrentUserProfile } from '@/api/firebase/users/userService';
import { useTranslation } from 'react-i18next';

export default function EmailCaseScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const { setUser } = useUserStore();
  const setToken = useTokenStore((state) => state.setToken);
  const { signOut, getToken } = useAuth();
  const { user: clerkUser } = useUser();

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
        Alert.alert(t('error'), t('login.errors.emailIdNotFound'));
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
      Alert.alert(t('error'), error?.errors?.[0]?.message || t('login.errors.sendCodeFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!signIn || !isLoaded || code.length !== 6) return;

    try {
      setIsLoading(true);
      setLoadingMessage(t('login.loadingSteps.verifying'));

      const attempt = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code,
      });

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });

        setLoadingMessage(t('login.loadingSteps.credentials'));
        const token = await getToken();
        if (!token) {
          Alert.alert(t('error'), t('login.errors.noToken'));
          return;
        }

        setToken(token);

        setLoadingMessage(t('login.loadingSteps.profile'));
        const userData = await getCurrentUser();
        if (!userData || !userData.id) {
          Alert.alert(t('error'), t('login.errors.noUserData'));
          await signOut();
          return;
        }

        setUser(userData);

        // VINCULAR CON FIREBASE
        try {
          setLoadingMessage(t('login.loadingSteps.realtime'));
          console.log("Vinculando sesión de Firebase...");
          await linkFirebaseSession();

          setLoadingMessage(t('login.loadingSteps.syncing'));
          await ensureCurrentUserProfile({
            displayName: userData?.name || undefined,
            photoURL: clerkUser?.imageUrl || undefined,
            phone: clerkUser?.phoneNumbers?.[0]?.phoneNumber || undefined,
          });
          
          console.log("✅ Sesión de Firebase vinculada exitosamente");
          
        } catch (firebaseError) {
          console.error("❌ Error vinculando sesión de Firebase:", firebaseError);
          // No bloquear el acceso - Firebase es opcional para funcionalidades básicas
          console.warn("⚠️ Continuando sin Firebase - Funcionalidades de chat limitadas");
        }

        setLoadingMessage(t('login.loadingSteps.welcome'));
        
        // Pequeña pausa para mostrar mensaje final
        setTimeout(() => {
          router.push('/(tabs)');
        }, 800);

      } else {
        Alert.alert(t('error'), t('login.errors.incompleteVerification'));
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      Alert.alert(t('error'), error?.errors?.[0]?.message || t('login.errors.invalidCode'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
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
              <Text style={styles.title}>{t('login.title')}</Text>
            </View>

            {!codeSent ? (
              <View style={styles.contentContainer}>
                <Text style={styles.instruction}>
                  {t('login.email.instruction')}
                </Text>
                <View style={styles.inputSection}>
                  <TextInput
                    style={styles.input}
                    placeholder={t('login.email.placeholder')}
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
                    <Text style={styles.continueButtonText}>{t('login.email.sendCode')}</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.verificationContainer}>
                <Text style={styles.subtitle}>
                  {t('login.email.codeSent', { email })}
                </Text>
                <Text style={styles.helpText}>{t('login.email.checkInbox')}</Text>

                <View style={styles.codeFieldContainer}>
                  <VerificationCodeField value={code} setValue={setCode} />
                </View>

                {/* Mostrar mensaje de carga específico */}
                {isLoading && loadingMessage && (
                  <View style={styles.loadingMessageContainer}>
                    <Text style={styles.loadingMessage}>{loadingMessage}</Text>
                  </View>
                )}

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
                    <Text style={styles.verifyButtonText}>{t('login.verification.verifyCode')}</Text>
                  )}
                </Pressable>

                <View style={styles.resendSection}>
                  {canResend ? (
                    <Pressable onPress={handleSendCode} style={styles.resendButton}>
                      <Text style={styles.resendText}>{t('login.verification.resendCode')}</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.timerText}>
                      {t('login.verification.resendAvailable', { timer })}
                    </Text>
                  )}
                </View>

                <View style={styles.changeSection}>
                  <Text style={styles.wrongText}>{t('login.email.wrongEmail')}</Text>
                  <Pressable onPress={() => setCodeSent(false)}>
                    <Text style={styles.changeText}>{t('login.email.changeHere')}</Text>
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
  // Nuevos estilos para mensaje de carga
  loadingMessageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 20,
    width: '80%',
  },
  loadingMessage: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
