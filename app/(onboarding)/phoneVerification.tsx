import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useUserStore } from "../../lib/storage/useUserStorage";
import { useSignUp, useAuth } from "@clerk/clerk-expo";
import { CodeField, Cursor, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';
import VerificationCodeField from "@/components/VerificationCodeField";

export default function PhoneVerificationScreen() {
  const { user, setUser } = useUserStore();
  const { signUp, isLoaded } = useSignUp();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);

  const CELL_COUNT = 6;

  const [value, setValue] = useState('');
  const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });

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
  
        // Verificamos el código con Clerk
        const result = await signUp.attemptPhoneNumberVerification({
          code: value,
        });

        console.log("Verification result:", result);
  
        if (result.status === "complete") {
          // Si la verificación es exitosa, guardamos el número de teléfono
  
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

  return (
    <View style={styles.container}>
      <Text style={styles.textTitle}>Verification Code</Text>
      
      <Text style={styles.instruction}>
        Enter the 6-digit code sent to{"\n"}{user?.phone || "+error"}.
      </Text>

      <VerificationCodeField value={value} setValue={setValue} />

      <Pressable
        onPress={handleVerifyCode}
        style={[
          styles.verifyButton,
         
        ]} 
      >
        {isLoading ? (
          <ActivityIndicator color="#7A33CC" />
        ) : (
          <Text style={styles.verifyButtonText}>Verify</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#7A33CC",
    paddingHorizontal: 20,
  },
  textTitle: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  instruction: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
  },
  codeInput: {
    backgroundColor: "#FFFFFF",
    width: "80%",
    height: 60,
    borderRadius: 10,
    fontSize: 24,
    textAlign: "center",
    marginBottom: 20,
  },
  resendButton: {
    marginTop: 20,
    padding: 10,
  },
  resendText: {
    color: "#FFFFFF",
    textDecorationLine: "underline",
    fontSize: 16,
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
  disabledButton: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: "#7A33CC",
    fontSize: 18,
    fontWeight: "bold",
  },
  codeFieldRoot: {
    marginTop: 20,
    width: 300,
    justifyContent: 'space-between',
  },
  cell: {
    width: 40,
    height: 50,
    lineHeight: 50,
    fontSize: 24,
    borderWidth: 2,
    borderColor: '#fff',
    textAlign: 'center',
    color: '#fff',
    borderRadius: 8,
  },
  focusCell: {
    borderColor: '#7A33CC',
  },
});