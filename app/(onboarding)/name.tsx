import { Link } from "expo-router";
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
import { useUserStore } from "../../lib/storage/useUserStorage";

export default function NameScreen() {
  const { user, setUser } = useUserStore();
  const [name, setName] = useState("");

  const handleNameChange = (name: string) => {
    setUser({ ...user, name });
  };

  const handleConfirm = (name: string) => {
    handleNameChange(name);
    console.log(user);
      if (name.trim() === "") {
        Alert.alert("Missing name", "Please enter your name before continuing.");
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
            <Text style={styles.textTitle}>Great, Let's {"\n"}Continue!</Text>
          </View>

          <View style={styles.imageContainer}>
            <Image
                source={require("../../assets/images/gettingCoffee.png")}
                style={styles.image}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.textSubtitle}>What's the best way to call you?</Text>

            <TextInput
                placeholder="Enter your name"
                placeholderTextColor="#11182766"
                style={styles.textInput}
                value={name}
                onChangeText={(text) => {
                    setName(text);
                    handleNameChange(text);
                }}
            />
          </View>

          <View style={styles.continueContainer}>
            {name.trim() !== "" ? (
                <Link href="/(onboarding)/phone" asChild>
                    <Pressable style={styles.continueButton} onPress={() => handleConfirm(name)}>
                        <Text style={styles.continueButtonText}>Continue</Text>
                    </Pressable>
                </Link>
            ) : (
                <Pressable style={[styles.continueButton, styles.disabledButton]} onPress={() => handleConfirm(name)}>
                    <Text style={styles.continueButtonText}>Continue</Text>
                </Pressable>
            )}
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
    marginTop: 60,
  },
  imageContainer: {
    alignContent: "center",
    alignItems: "center",
    marginVertical: 20,
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