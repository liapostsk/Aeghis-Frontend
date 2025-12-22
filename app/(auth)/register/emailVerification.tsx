import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from "../../../lib/storage/useUserStorage";
import { useSignUp, useAuth, useUser as useClerkUser } from "@clerk/clerk-expo";
import VerificationCodeField from "@/components/ui/VerificationCodeField";
import ContinueButton from "../../../components/ui/ContinueButton";
import { useTokenStore } from "@/lib/auth/tokenStore";
import { useTranslation } from 'react-i18next';

const validateCode = (code: string, t: any) => {
  if (!code || code.trim() === '') {
    return { isValid: false, message: t('register.emailVerification.validation.empty') };
  }
  
  if (code.length !== 6) {
    return { isValid: false, message: t('register.emailVerification.validation.invalidLength') };
  }
  
  if (!/^\d{6}$/.test(code)) {
    return { isValid: false, message: t('register.emailVerification.validation.onlyDigits') };
  }
  
  return { isValid: true, message: "" };
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function EmailVerificationScreen() {
  // Router and context
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const { t } = useTranslation();

  // Clerk authentication
  const { signUp, setActive, isLoaded } = useSignUp();
  const { getToken, signOut } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Valores computados
  const validation = validateCode(verificationCode, t);
  const canVerify = validation.isValid && !isLoading;

  const handleVerifyCode = async () => {
    if (!isLoaded || !signUp) {
      return Alert.alert(t('error'), t('register.emailVerification.alerts.authNotReady'));
    }

    if (!validation.isValid) {
      return Alert.alert(t('register.name.alerts.invalidName'), validation.message);
    }

    if (!user?.phone) {
      return Alert.alert(t('error'), t('register.emailVerification.alerts.phoneRequired'));
    }

    try {
      setIsLoading(true);
      const result = await signUp.attemptEmailAddressVerification({ code: verificationCode });

      if (result.status === "complete") {
        // En este punto, el usuario YA está creado en Clerk
                
        try {
          // Activar la sesión en Clerk
          await setActive({ session: result.createdSessionId });
          
          // Obtener el token JWT
          const token = await getToken();
          if (token) {
            setToken(token);
          }

          // Guardar el email en el store local
          setUser({ ...user, email: user?.email || "No email available" });
          
          Alert.alert(t('register.emailVerification.alerts.success.title'), t('register.emailVerification.alerts.success.message'));
          router.push('/(auth)/infoForm');
          
        } catch (navigationError: any) {
          console.error("Error después de verificación exitosa:", navigationError);
        }
        
      } else if (result.status === "missing_requirements") {
        Alert.alert(t('error'), t('register.emailVerification.alerts.missingRequirements'));
      } else {
        Alert.alert(t('error'), t('register.emailVerification.alerts.unexpectedStatus', { status: result.status }));
      }

    } catch (error: any) {
      console.error("Verification error:", error);
      const errorMessage = error?.errors?.[0]?.message || error?.message || t('register.email.errors.sendFailed');
      Alert.alert(t('error'), errorMessage);
      // NOTA: Aquí NO hacemos rollback porque el error es de verificación,
      // el usuario todavía no se ha creado completamente en Clerk
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!signUp) return;

    try {
      setIsLoading(true);
      await signUp.prepareEmailAddressVerification();
      setTimer(60);
      setCanResend(false);
      setVerificationCode('');
      Alert.alert(t('register.emailVerification.alerts.codeSent.title'), t('register.emailVerification.alerts.codeSent.message'));
    } catch (error: any) {
      console.error("Resend error:", error);
      Alert.alert(t('error'), t('register.emailVerification.alerts.resendFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Timer para reenvío
  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // Auto-verificar cuando se complete el código
  useEffect(() => {
    if (verificationCode.length === 6 && validation.isValid) {
      const timeout = setTimeout(() => {
        handleVerifyCode();
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [verificationCode]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.titleContainer}>
              <Text style={styles.textTitle}>{t('register.emailVerification.title')}</Text>
              <Text style={styles.subtitle}>{t('register.emailVerification.subtitle')}</Text>
            </View>

            <View style={styles.verificationContainer}>
              <Text style={styles.instruction}>
                {t('register.emailVerification.instruction', { email: user?.email || "No email available" })}
              </Text>
              <Text style={styles.helpText}>
                {t('register.emailVerification.helpText')}
              </Text>

              <View style={styles.codeFieldContainer}>
                <VerificationCodeField
                  value={verificationCode}
                  setValue={setVerificationCode}
                  cellCount={6}
                />
              </View>

              {verificationCode && !validation.isValid && (
                <Text style={styles.errorText}>{validation.message}</Text>
              )}

              <View style={styles.buttonContainer}>
                <ContinueButton
                  onPress={handleVerifyCode}
                  text={verificationCode.length === 6 ? t('register.emailVerification.button.verify') : t('register.emailVerification.button.enterMore', { count: 6 - verificationCode.length })}
                  disabled={!canVerify}
                  loading={isLoading}
                />
              </View>

              {/* Sección de Resend Code */}
              <View style={styles.resendSection}>
                {canResend ? (
                  <Pressable onPress={handleResendCode} style={styles.resendButton}>
                    <Text style={styles.resendText}>{t('register.emailVerification.resend.button')}</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.timerText}>
                    {t('register.emailVerification.resend.timer', { time: formatTime(timer) })}
                  </Text>
                )}
              </View>

              {/* Sección para ir atrás */}
              <View style={styles.backSection}>
                <Text style={styles.wrongEmailText}>{t('register.emailVerification.wrongEmail.text')}</Text>
                <Pressable onPress={() => router.back()}>
                  <Text style={styles.backText}>{t('register.emailVerification.wrongEmail.link')}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#7A33CC",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  textTitle: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    color: "#E8D5FF",
    fontSize: 16,
    textAlign: "center",
  },
  verificationContainer: {
    width: "100%",
    alignItems: "center",
  },
  instruction: {
    color: "#FFFFFF",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 8,
  },
  helpText: {
    color: "#E8D5FF",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 30,
  },
  codeFieldContainer: {
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#FFB3B3",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
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
  backSection: {
    alignItems: 'center',
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    width: '80%',
  },
  wrongEmailText: {
    color: '#E8D5FF',
    fontSize: 14,
    marginBottom: 5,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: "underline",
  },
});
