import React, { useState, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from "react-native";
import { useUser } from "../../context/UserContext";
import { SafeAreaView } from 'react-native-safe-area-context';
import PhoneInput, {
  ICountry,
  isValidPhoneNumber,
} from 'react-native-international-phone-number';
import { useRouter } from "expo-router";
import { useSignUp } from '@clerk/clerk-expo';

export default function PhoneScreen() {
  const { user, setUser } = useUser();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<null | ICountry>(null);
  const [isValid, setIsValid] = useState(false);
  const { signUp } = useSignUp();


  const handleInputValue = (phoneNumber: string) => {
    setPhone(phoneNumber);
    setIsValid(
      selectedCountry ? isValidPhoneNumber(phoneNumber, selectedCountry) : false
    );
  };

  const handleSelectedCountry = (country: ICountry) => {
    setSelectedCountry(country);
  };

  const sendCode = async () => {
    if (!selectedCountry || !signUp) return;

    const fullPhone = `${selectedCountry.callingCode}${phone.replace(/\s/g, '')}`;
    
    try {
      // 1. Crear el registro en Clerk con el teléfono
      await signUp.create({
        phoneNumber: fullPhone,
      });

      // 2. Pedir que Clerk envíe el código por SMS
      await signUp.preparePhoneNumberVerification();

      // 3. Guardamos el número para usarlo luego
      setUser({
        ...user,
        phone: fullPhone,
      });

      // 4. Navegamos a la siguiente pantalla
      router.push("/(onboarding)/phoneVerification");
    } catch (error: any) {
      console.error("Error sending SMS:", error);
      Alert.alert("Error", error?.errors?.[0]?.message || "Failed to send SMS.");
    }
  };


  return (
    <SafeAreaView style={styles.container}>

      <Text style={styles.textTitle}>
        Hey {user.name}, let's{"\n"}verify your phone number!
      </Text>

      <PhoneInput
        value={phone}
        onChangePhoneNumber={handleInputValue}
        selectedCountry={selectedCountry}
        onChangeSelectedCountry={handleSelectedCountry}
        placeholder="Enter phone number"
        defaultCountry="ES"
        phoneInputStyles={{
          container: {
            borderWidth: 1,
            position: "absolute",
            top: "40%",
            width: 375,
            borderStyle: 'solid',
            borderColor: '#F3F3F3',
          },
        }}
      />

      <Pressable
        onPress={sendCode}
        style={[styles.continueButton, !isValid && styles.disabledButton]}
        disabled={!isValid}
      >
        <Text style={styles.continueButtonText}>Send Code</Text>
      </Pressable>
    
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
  textTitle: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "bold",
    position: "absolute",
    top: "15%",
  },
  continueButton: {
    width: 300,
    height: 55,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: "50%",
  },
  disabledButton: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: "#7A33CC",
    fontSize: 18,
    fontWeight: "bold",
  },
});
