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
import { useUserStore } from "../../lib/storage/useUserStorage";
import { useSignUp } from "@clerk/clerk-expo";
import VerificationCodeField from "@/components/ui/VerificationCodeField";

export default function PhoneVerificationScreen() {
  const { user, setUser } = useUserStore();
  const { signUp, isLoaded } = useSignUp();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const handleVerifyCode = async () => {
    if (!isLoaded || !signUp) {
      Alert.alert("Error", "Auth not ready.");
      return;
    }

    if (!value || value.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit code.");
      return;
    }

    try {
      setIsLoading(true);

      const result = await signUp.attemptPhoneNumberVerification({
        code: value,
      });

      console.log("Verification result:", result);

      if (result.status === "complete") {
        Alert.alert("Success", "Phone number verified!");
        router.push("/(onboarding)/email");
      } else if (result.status === "missing_requirements") {
        if (result.missingFields.includes("email_address")) {
          console.log("Email address is missing. Continue to email verification.");
          Alert.alert("Success", "Phone number verified! Please verify your email.");
          router.push("/(onboarding)/email");
        } else {
          Alert.alert("Error", "Other fields missing: " + result.missingFields.join(", "));
        }
      } else {
        Alert.alert("Error", "Unexpected verification status: " + result.status);
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error?.errors?.[0]?.message || "Invalid verification code.");
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
      Alert.alert("Success", "Code sent again!");
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error?.errors?.[0]?.message || "Could not resend code.");
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

  const renderContent = () => (
    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.textTitle}>Almost there! 🎉</Text>
          <Text style={styles.subtitle}>Let's verify your phone number</Text>
        </View>

        <View style={styles.verificationContainer}>
          <Text style={styles.instruction}>
            We've sent a 6-digit code to{"\n"}{user?.phone || "+error"}
          </Text>
          <Text style={styles.helpText}>
            Please check your messages 📱
          </Text>

          <View style={styles.codeFieldContainer}>
            <VerificationCodeField value={value} setValue={setValue} />
          </View>

          <Pressable
            onPress={handleVerifyCode}
            style={[
              styles.verifyButton,
              (isLoading || value.length !== 6) && styles.verifyButtonDisabled
            ]} 
            disabled={isLoading || value.length !== 6}
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
              <Pressable onPress={handleResendCode} style={styles.resendButton}>
                <Text style={styles.resendText}>📨 Resend code</Text>
              </Pressable>
            ) : (
              <Text style={styles.timerText}>
                Resend available in {timer}s
              </Text>
            )}
          </View>

          {/* Sección para ir atrás */}
          <View style={styles.backSection}>
            <Text style={styles.wrongNumberText}>Wrong number?</Text>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.backText}>Go back to change it</Text>
            </Pressable>
          </View>
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
    marginBottom: 60,
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
    marginBottom: 20,
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