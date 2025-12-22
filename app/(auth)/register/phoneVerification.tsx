import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from "../../../lib/storage/useUserStorage";
import { useSignUp } from "@clerk/clerk-expo";
import VerificationCodeField from "@/components/ui/VerificationCodeField";
import { useTranslation } from 'react-i18next';

const validateCode = (code: string, t: any) => {
  if (!code || code.trim() === '') {
    return { isValid: false, message: t('register.phoneVerification.validation.empty') };
  }
  
  if (code.length !== 6) {
    return { isValid: false, message: t('register.phoneVerification.validation.invalidLength') };
  }
  
  if (!/^\d{6}$/.test(code)) {
    return { isValid: false, message: t('register.phoneVerification.validation.onlyDigits') };
  }
  
  return { isValid: true, message: "" };
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function PhoneVerificationScreen() {
  // Store y router
  const { user, setUser } = useUserStore();
  const { signUp, isLoaded } = useSignUp();
  const router = useRouter();
  const { t } = useTranslation();

  // Estados
  const [isLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Valores computados
  const validation = validateCode(value, t);
  const canVerify = validation.isValid && !isLoading;

  const handleVerifyCode = async () => {
    if (!isLoaded || !signUp) {
      Alert.alert(t('error'), t('register.phoneVerification.alerts.authNotReady'));
      return;
    }

    if (!validation.isValid) {
      Alert.alert(t('register.name.alerts.invalidName'), validation.message);
      return;
    }

    try {
      setIsLoading(true);
      const result = await signUp.attemptPhoneNumberVerification({ code: value });

      if (result.status === "complete" || result.status === "missing_requirements") {
        router.push("/(auth)/register/email");
      } else {
        Alert.alert(t('error'), t('register.phoneVerification.alerts.verificationFailed'));
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.errors?.[0]?.message || t('register.phoneVerification.alerts.invalidCode');
      Alert.alert(t('error'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!signUp) return;
    
    try {
      setIsLoading(true);
      await signUp.preparePhoneNumberVerification();
      setTimer(60);
      setCanResend(false);
      setValue('');
      Alert.alert(t('register.phoneVerification.alerts.success.title'), t('register.phoneVerification.alerts.success.message'));
    } catch (error: any) {
      console.error(error);
      Alert.alert(t('error'), error?.errors?.[0]?.message || t('register.phoneVerification.alerts.resendFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev === 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // Auto-verificar cuando se complete el código
  useEffect(() => {
    if (value.length === 6) {
      const timer = setTimeout(() => {
        handleVerifyCode();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [value]);

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
              <Text style={styles.textTitle}>{t('register.phoneVerification.title')}</Text>
              <Text style={styles.subtitle}>{t('register.phoneVerification.subtitle')}</Text>
            </View>

            <View style={styles.verificationContainer}>
              <Text style={styles.instruction}>
                {t('register.phoneVerification.instruction', { phone: user?.phone || "+error" })}
              </Text>
              <Text style={styles.helpText}>
                {t('register.phoneVerification.helpText')}
              </Text>

              <View style={styles.codeFieldContainer}>
                <VerificationCodeField value={value} setValue={setValue} />
              </View>

              <Pressable
                onPress={handleVerifyCode}
                style={[
                  styles.verifyButton,
                  !canVerify && styles.verifyButtonDisabled
                ]} 
                disabled={!canVerify}
              >
                {isLoading ? (
                  <ActivityIndicator color="#7A33CC" />
                ) : (
                  <Text style={styles.verifyButtonText}>
                    {value.length === 6 ? t('register.phoneVerification.button.verify') : t('register.phoneVerification.button.enterMore', { count: 6 - value.length })}
                  </Text>
                )}
              </Pressable>

              {/* Sección de Resend Code */}
              <View style={styles.resendSection}>
                {canResend ? (
                  <Pressable onPress={handleResendCode} style={styles.resendButton}>
                    <Text style={styles.resendText}>{t('register.phoneVerification.resend.button')}</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.timerText}>
                    {t('register.phoneVerification.resend.timer', { time: formatTime(timer) })}
                  </Text>
                )}
              </View>

              {/* Sección para ir atrás */}
              <View style={styles.backSection}>
                <Text style={styles.wrongNumberText}>{t('register.phoneVerification.wrongNumber.text')}</Text>
                <Pressable onPress={() => router.back()}>
                  <Text style={styles.backText}>{t('register.phoneVerification.wrongNumber.link')}</Text>
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
  verifyButton: {
    width: "80%",
    height: 55,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
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
  backSection: {
    alignItems: 'center',
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    width: '80%',
  },
  wrongNumberText: {
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