import { 
    Text,
    View,
    StyleSheet,
    Pressable,
    Image,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import { router } from "expo-router";
import { useUserStore } from "../../../lib/storage/useUserStorage";
import { useTranslation } from 'react-i18next';

const validateName = (name: string, t: any) => {
  const trimmedName = name.trim();
  
  if (trimmedName === "") {
    return { isValid: false, message: t('register.name.validation.empty') };
  }
  
  if (trimmedName.length < 2) {
    return { isValid: false, message: t('register.name.validation.tooShort') };
  }
  
  if (trimmedName.length > 25) {
    return { isValid: false, message: t('register.name.validation.tooLong') };
  }
  
  // Basic regex to allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  if (!nameRegex.test(trimmedName)) {
    return { isValid: false, message: t('register.name.validation.invalidChars') };
  }
  
  return { isValid: true, message: "" };
};

export default function NameScreen() {
  // State
  const { user, setUser } = useUserStore();
  const [name, setName] = useState("");
  const { t } = useTranslation();

  // Computed values
  const validation = validateName(name, t);
  const canContinue = validation.isValid;

  // Event handlers
  const handleNameChange = (text: string) => {
    setName(text);
    setUser({ ...user, name: text.trim() });
  };

  const handleContinue = () => {
    if (canContinue) {
      router.push("/(auth)/register/phone");
    } else {
      Alert.alert(t('register.name.alerts.invalidName'), validation.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.containerTitle}>
            <Text style={styles.textTitle}>{t('register.name.title')}</Text>
          </View>

          <View style={styles.imageContainer}>
            <Image
                source={require("../../../assets/images/gettingCoffee.png")}
                style={styles.image}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.textSubtitle}>{t('register.name.subtitle')}</Text>

            <TextInput
                placeholder={t('register.name.placeholder')}
                placeholderTextColor="#11182766"
                style={styles.textInput}
                value={name}
                onChangeText={handleNameChange}
                maxLength={50}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
            />
          </View>

          <View style={styles.continueContainer}>
            <Pressable 
              style={[styles.continueButton, !canContinue && styles.disabledButton]} 
              onPress={handleContinue}
              disabled={!canContinue}
            >
              <Text style={styles.continueButtonText}>{t('register.name.button')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Reference for the image used in the app:
// <a href="https://storyset.com/online">Online illustrations by Storyset</a>

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#7A33CC",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  containerTitle: {
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
    top: "10%",
  },
  imageContainer: {
    alignContent: "center",
    alignItems: "center",
    top: "5%",
  },
  inputContainer: {
    alignContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  continueContainer: {
    alignContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  image: {
    width: 300,
    height: 300,
  },
  textTitle: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
  },
  textSubtitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    width: 300,
    height: 60,
    borderRadius: 10,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#000",
  },
  continueButton: {
    width: 300,
    height: 55,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
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