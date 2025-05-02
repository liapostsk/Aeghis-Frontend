// Index is the main screen of the app, the entry point of the app
import { useAuth } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View, StyleSheet, Pressable, Image } from "react-native"; 
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("isSignedIn:", isSignedIn);
    // Si el usuario ya está autenticado, redirigir a la pantalla principal
    if (isSignedIn) {
      router.replace("/(tabs)"); // 👈 redirige automáticamente
    }
  }, [isSignedIn]);
  
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.textTitle}>Welcome to Aegis!</Text>
      <Image
        source={require("../assets/images/welcomePage.png")}
        style={styles.image}
      />
    
      <Pressable 
        style={styles.buttonSignUp}
        onPress={() => router.push("/(onboarding)")}
      >
        <Text style={styles.textSignUp}>Sign Up</Text>
      </Pressable>

      <View style={{ flexDirection: 'row', marginTop: 20, alignItems: 'center', position: 'absolute', bottom: '15%' }}>
        <Text style={{ color: 'white', fontSize: 18 }}>
          Already have an account?{'  '}
        </Text>
        <Pressable onPress={() => router.replace("/(login)")}>
          <Text style={{ color: "#0003B2", fontSize: 18, fontWeight: 'bold' }}>
            Log In
          </Text>
        </Pressable>
      </View>
      
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
    top: "35%",
  },
  buttonSignUp: {
    backgroundColor: "#3232C3",
    padding: 30,
    width: 300,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: "20%",
    borderRadius: 20,
    borderColor: "#FFFFFF",
  },
  textSignUp: { 
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    position: "absolute",
    fontSize: 25,
  },
  textTitle: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "bold",
    position: "absolute",
    top: "15%",
  },
});
