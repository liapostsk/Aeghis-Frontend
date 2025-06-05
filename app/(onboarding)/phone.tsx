import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import { useSignUp } from '@clerk/clerk-expo';
import ContinueButton from "../../components/ui/ContinueButton";
import { useUserStore } from "../../lib/storage/useUserStorage";
import PhoneNumberPicker from '@/components/ui/PhoneNumberPicker';

export default function PhoneScreen() {
  const { user, setUser } = useUserStore();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState<'ES' | string>('ES');
  const [callingCode, setCallingCode] = useState('34');
  const [isValid, setIsValid] = useState(false);
  const { signUp } = useSignUp();

  const sendCode = async () => {
    if (!phone || !callingCode || !signUp) return;

    const fullPhone = `+${callingCode}${phone.replace(/\s/g, '')}`;

    try {
      await signUp.create({ phoneNumber: fullPhone });
      await signUp.preparePhoneNumberVerification();
      setUser({ ...user, phone: fullPhone });
      router.push("/(onboarding)/phoneVerification");
    } catch (error: any) {
      console.error("Error sending SMS:", error);
      Alert.alert("Error", error?.errors?.[0]?.message || "Failed to send SMS.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.textTitle}>
          Hey {user?.name || "User"}, let's{"\n"}verify your phone number!
        </Text>
      </View>

      <View style={styles.phoneContainer}>
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
            setIsValid(text.length >= 6); // cambia validación según prefieras
          }}
          keyboardType="phone-pad"
          placeholder="Phone number"
          placeholderTextColor="#aaa"
          style={styles.phoneInput}
        />
      </View>
      <View style={styles.buttonContainer}>
        <ContinueButton
          onPress={sendCode}
          text="Send Code"
          disabled={!isValid}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#7A33CC",
    paddingBottom: 70,
  },
  titleContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    top: -100,
    paddingHorizontal: 40,
  },
  textTitle: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "bold",
    paddingLeft: 20,
  },
  phoneContainer: {
    flexDirection: 'row',
    marginTop: 30,
    marginHorizontal: 20,
    backgroundColor: '#E3D5F5',
    borderRadius: 10,
    overflow: 'hidden',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F1EAFD',
    padding: 12,
    fontSize: 16,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  buttonContainer: {
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    bottom: -20,
  },
});
