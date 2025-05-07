import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useUserStore } from "../../lib/storage/useUserStorage";
import { useSignUp, useAuth, useUser as useClerkUser } from "@clerk/clerk-expo";
import VerificationCodeField from "@/components/VerificationCodeField";
import { mapUserToDto } from "../../api/user/mapper";
import { createUser } from "../../api/user/userApi";
import { useTokenStore } from "@/lib/auth/tokenStore";


export default function EmailVerificationScreen() {
  // Router and context
  const router = useRouter();
  const { user, setUser } = useUserStore();

  // Clerk authentication
  const { signUp, setActive, isLoaded } = useSignUp();
  const { getToken, signOut } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);
  const { user: clerkUser } = useClerkUser();

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const isCodeValid = verificationCode && verificationCode.length === 6;


  const handleVerifyCode = async () => {
    // Validation checks
    if (!isLoaded || !signUp) {
      return Alert.alert("Error", "Auth not ready.");
    }
  
    if (!isCodeValid) {
      return Alert.alert("Error", "Please enter the 6-digit code.");
    }
  
    if (!user || !user.phone) {
      return Alert.alert(
        "Error",
        "You must verify your phone number before continuing."
      );
    }
  
    try {
      setIsLoading(true);

      // Step 1: Verify email with Clerk
      const result = await signUp.attemptEmailAddressVerification({ code: verificationCode });
  
      console.log("Verification result:", result);
  
      if (result.status === "complete") {
        // Step 2: Activate Clerk session to get token
        await setActive({ session: signUp.createdSessionId });

        const token = await getToken();
        console.log("Token:", token);
        if (!token) {
          return Alert.alert("Error", "Failed to get token.");
        }
        setToken(token); // <—— necesario

        // Step 3: Create user in backend
        try {
          const dto = mapUserToDto({ ...user});
          console.log("User DTO:", dto);

          const userId = await createUser(dto);
          console.log("User created with ID:", userId);

          // Step 4: Update local user state
          setUser({
            ...user,
            id: userId,
          });
  
          Alert.alert("Success", "Email verified and user created!");
          router.push("/(tabs)");
        } catch (apiError: any) {
          console.error("API error:", apiError);
          console.log("HOLAAAA")
          // Clean up Clerk session on backend error
          await clerkUser?.delete(); // Elimina en Clerk
          await signOut(); // Cierra sesión

          // Handle backend user creation error
          console.error("Error creating user in backend:", apiError);
          const message = apiError?.message || "Failed to create user in backend.";
          Alert.alert("Error", message);
        }
  
      } else if (result.status === "missing_requirements") {
        Alert.alert("Error", "Phone number or email verification incomplete.");
      } else {
        Alert.alert("Error", `Unexpected status: ${result.status}`);
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      Alert.alert(
        "Error",
        error?.errors?.[0]?.message || "Failed to verify the email."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.textTitle}>Email Verification</Text>

      <Text style={styles.instruction}>
        Enter the 6-digit code sent to your email:{"\n"}
        {user?.email || "No email available"}
      </Text>

      <VerificationCodeField
        value={verificationCode}
        setValue={setVerificationCode}
        cellCount={6}
        >
      </VerificationCodeField>

      <Pressable
        onPress={handleVerifyCode}
        style={[
          styles.verifyButton,
          !isCodeValid && styles.disabledButton,
        ]}
        disabled={!isCodeValid || isLoading}
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
});
