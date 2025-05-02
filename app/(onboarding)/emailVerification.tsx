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
import { useUser } from "../../context/UserContext";
import { useAuth, useSignUp } from "@clerk/clerk-expo";
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from "react-native-confirmation-code-field";
import { mapUserToDto } from "../../api/mapper";
import { createUser } from "../../api/userApi";

export default function EmailVerificationScreen() {
  const { user, setUser } = useUser();
  const { signUp, setActive, isLoaded } = useSignUp();
  const { getToken } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState("");
  const CELL_COUNT = 6;

  const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue,
  });

  const handleVerifyCode = async () => {
    if (!isLoaded || !signUp) {
      return Alert.alert("Error", "Auth not ready.");
    }
  
    if (!value || value.length !== 6) {
      return Alert.alert("Error", "Please enter the 6-digit code.");
    }
  
    if (!user.phone) {
      return Alert.alert(
        "Error",
        "You must verify your phone number before continuing."
      );
    }
  
    try {
      setIsLoading(true);
  
      const result = await signUp.attemptEmailAddressVerification({ code: value });
  
      console.log("Verification result:", result);
  
      if (result.status === "complete") {
        // Antes de activar sesión en Clerk, intentamos crear el usuario en el backend
        const dto = mapUserToDto({ ...user});
        console.log("User DTO:", dto);
  
        try {
          const response = await createUser(dto);
          console.log("User created:", response);
  
          // Ahora que el usuario se creó correctamente, activamos sesión y navegamos
          await setActive({ session: signUp.createdSessionId });
  
          const token = await getToken();
          setUser({
            ...user,
            isEmailVerified: true,
            id: response,
            token: token || undefined,
          });
  
          Alert.alert("Success", "Email verified and user created!");
          router.push("/(tabs)");
        } catch (apiError: any) {
          console.error("Error creating user in backend:", apiError);
          const message =
            apiError?.message || "Failed to create user in backend.";
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
        {user.email}
      </Text>

      <CodeField
        ref={ref}
        {...props}
        value={value}
        onChangeText={setValue}
        cellCount={CELL_COUNT}
        rootStyle={styles.codeFieldRoot}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        renderCell={({ index, symbol, isFocused }) => (
          <Text
            key={index}
            style={[styles.cell, isFocused && styles.focusCell]}
            onLayout={getCellOnLayoutHandler(index)}
          >
            {symbol || (isFocused ? <Cursor /> : null)}
          </Text>
        )}
      />

      <Pressable
        onPress={handleVerifyCode}
        style={[
          styles.verifyButton,
          (!value || value.length !== 6) && styles.disabledButton,
        ]}
        disabled={!value || value.length !== 6 || isLoading}
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
  codeFieldRoot: {
    marginTop: 20,
    width: 300,
    justifyContent: "space-between",
  },
  cell: {
    width: 40,
    height: 50,
    lineHeight: 50,
    fontSize: 24,
    borderWidth: 2,
    borderColor: "#fff",
    textAlign: "center",
    color: "#fff",
    borderRadius: 8,
  },
  focusCell: {
    borderColor: "#7A33CC",
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
