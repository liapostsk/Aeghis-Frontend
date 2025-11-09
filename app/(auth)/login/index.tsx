import React, { useState, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Pressable,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSignIn, useAuth, useUser } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import PhoneNumberPicker from '@/components/ui/PhoneNumberPicker';
import VerificationCodeField from '@/components/ui/VerificationCodeField';
import ContinueButton from '@/components/ui/ContinueButton';
import { getCurrentUser } from '@/api/backend/user/userApi';
import { useUserStore } from '@/lib/storage/useUserStorage';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { linkFirebaseSession } from '@/api/firebase/auth/firebase';
import { ensureCurrentUserProfile } from '@/api/firebase/users/userService';

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { user: clerkUser } = useUser();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState<'ES' | string>('ES');
  const [callingCode, setCallingCode] = useState('34');
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

  const fullPhone = `${callingCode}${phone.replace(/\s/g, '')}`;

  const handleSendCode = async () => {
    if (!signIn || !isValid) return;

    try {
      setIsLoading(true);
      await signIn.create({ identifier: fullPhone });

      const phoneCodeFactor = signIn.supportedFirstFactors?.find(
        (factor) => factor.strategy === 'phone_code'
      );

      if (!phoneCodeFactor || !('phoneNumberId' in phoneCodeFactor)) {
        Alert.alert("Error", "Phone number ID not found.");
        return;
      }

      await signIn.prepareFirstFactor({
        strategy: 'phone_code',
        phoneNumberId: phoneCodeFactor.phoneNumberId,
      });

      setCodeSent(true);
      setTimer(60);
      setCanResend(false);
      setCode('');
    } catch (error: any) {
      console.error("Send code error:", error);
      Alert.alert("Could not send verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!signIn || !isLoaded || code.length !== 6) return;

    try {
      setIsLoading(true);
      setLoadingMessage('Verificando código...');

      const attempt = await signIn.attemptFirstFactor({
        strategy: 'phone_code',
        code,
      });

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        
        setLoadingMessage('Obteniendo credenciales...');
        const token = await getToken();

        if (!token) {
          Alert.alert("Error", "No token received from Clerk.");
          return;
        }

        setToken(token);

        setLoadingMessage('Cargando tu perfil...');
        const userData = await getCurrentUser();

        if (!userData || !userData.id) {
          Alert.alert("Error", "We couldn't retrieve your account. Please try again.");
          await signOut();
          return;
        }

        setUser(userData);

        // VINCULAR CON FIREBASE
        try {
          setLoadingMessage('Configurando servicios en tiempo real...');
          console.log("Vinculando sesión de Firebase...");
          await linkFirebaseSession();

          setLoadingMessage('Sincronizando perfil...');
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

        setLoadingMessage('¡Bienvenido de vuelta!');
        
        // Pequeña pausa para mostrar mensaje final
        setTimeout(() => {
          router.push('/(tabs)');
        }, 800);

      } else {
        Alert.alert("Error", "Incomplete verification.");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      Alert.alert("Error", error?.errors?.[0]?.message || "Invalid verification code.");
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  useEffect(() => {
    if (!codeSent || timer <= 0) return;

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
  }, [codeSent, timer]);

  const renderContent = () => (
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
          <View style={styles.inputContainer}>
            <View style={styles.phoneRow}>
              <PhoneNumberPicker
                onChange={({ countryCode, callingCode }) => {
                  setCountryCode(countryCode);
                  setCallingCode(callingCode);
                }}
              />
              <TextInput
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setIsValid(text.length >= 6);
                }}
                keyboardType="phone-pad"
                placeholder="Phone number"
                placeholderTextColor="#aaa"
                style={styles.phoneInput}
              />
            </View>

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
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to {fullPhone}
            </Text>
            <Text style={styles.helpText}>
              Please check your messages 📱
            </Text>
            
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
                (isLoading || code.length !== 6) && styles.verifyButtonDisabled
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

            {/* Sección de Resend Code */}
            <View style={styles.resendSection}>
              {canResend ? (
                <Pressable onPress={handleSendCode} style={styles.resendButton}>
                  <Text style={styles.resendText}> Resend code</Text>
                </Pressable>
              ) : (
                <Text style={styles.timerText}>
                  Resend available in {timer}s
                </Text>
              )}
            </View>

            {/* Sección separada para cambiar número */}
            <View style={styles.changeNumberSection}>
              <Text style={styles.wrongNumberText}>Wrong number?</Text>
              <Pressable onPress={() => setCodeSent(false)}>
                <Text style={styles.changeNumberText}>Change it here</Text>
              </Pressable>
            </View>
          </View>
        )}
        <View style={{ marginTop: 30 }}>
          <Text style={{ color: '#E8D5FF', textAlign: 'center' }}>¿Prefieres usar tu correo?</Text>
          <Pressable onPress={() => router.push('./emailCase')}>
            <Text style={{ color: '#FFFFFF', textAlign: 'center', textDecorationLine: 'underline', marginTop: 8 }}>
              Iniciar con correo
            </Text>
          </Pressable>
        </View>

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
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  titleContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 90,
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
  phoneRow: {
    flexDirection: 'row',
    backgroundColor: '#E3D5F5',
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
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
  buttonSpacing: {
    marginTop: 30,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
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
  changeNumberSection: {
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
  changeNumberText: {
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
    marginTop: 20,
    marginBottom: 10,
    width: '80%',
  },
  loadingMessage: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});