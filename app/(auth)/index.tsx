import { useRouter } from "expo-router";
import { Text, View, StyleSheet, Pressable, Image } from "react-native"; 
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import { unlinkFirebaseSession } from "@/api/firebase/auth/firebase";
import { useUserStore } from "@/lib/storage/useUserStorage";
import { useTranslation } from 'react-i18next';

export default function Index() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { clearUser } = useUserStore();
  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      await unlinkFirebaseSession();
      await signOut();
      clearUser();
      console.log("Sesión cerrada manualmente");
      router.replace("/(auth)");
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {__DEV__ && (
        <Pressable 
          style={styles.debugLogoutButton} 
          onPress={handleLogout}
        >
          <Text style={styles.debugLogoutText}>{t('welcome.debugLogout')}</Text>
        </Pressable>
      )}
      
      <Text style={styles.textTitle}>{t('welcome.title')}</Text>
      <Image
        source={require("../../assets/images/welcomePage.png")}
        style={styles.image}
      />
    
      <Pressable 
        style={styles.buttonSignUp}
        onPress={() => router.push("/(auth)/register")}
      >
        <Text style={styles.textSignUp}>{t('welcome.signUp')}</Text>
      </Pressable>

      <View style={{ flexDirection: 'row', marginTop: 20, alignItems: 'center', position: 'absolute', bottom: '15%' }}>
        <Text style={{ color: 'white', fontSize: 18 }}>
          {t('welcome.alreadyHaveAccount')}{'  '}
        </Text>
        <Pressable onPress={() => router.push("/(auth)/login")}>
          <Text style={{ color: "#0003B2", fontSize: 18, fontWeight: 'bold' }}>
            {t('welcome.logIn')}
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
  debugLogoutButton: {
    position: "absolute",
    top: 60,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  debugLogoutText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
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