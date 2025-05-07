// Index is the main screen of the app, the entry point of the app
import { Link } from "expo-router";
import { 
    Text,
    View,
    StyleSheet,
    Pressable,
    Image,
    TextInput,
    Alert,
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
          <Text style={styles.textTitle}>Great, Let's {"\n"}Continue!</Text>

          <Image
              source={require("../../assets/images/gettingCoffee.png")}
              style={styles.image}
          />

          <Text style={styles.textSubtitle}>What’s the best way to call you?</Text>

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

          {/* Botón */}
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
      </SafeAreaView>
  );
}

// Reference for the image used in the app:
// <a href="https://storyset.com/online">Online illustrations by Storyset</a>

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "#7A33CC",
    paddingBottom: 70,
  },
  image: {
    width: 300,
    height: 300,
    position: "absolute",
    top: "27%",
  },
  textTitle: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "bold",
    position: "absolute",
    top: "15%",
  },
  textSubtitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "bold",
    position: "absolute",
    bottom: "35%",
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    width: 300,
    height: 60,
    borderRadius: 10,
    paddingHorizontal: 20,
    marginTop: 20,
    position: "absolute",
    bottom: "25%",
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
    position: "absolute",
    bottom: 40,
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
