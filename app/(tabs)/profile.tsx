import React from "react";
import { View, Text, Button, Alert } from "react-native";
import { useAuth, useUser as useClerkUser } from "@clerk/clerk-expo";
import { useUser as useFrontUser } from "../../context/UserContext";
import { SignOutButton } from "@/components/SignOutButton";
import { deleteUser } from "../../api/user/userApi";

const ProfileScreen = () => {
  const { signOut } = useAuth();
  const { user: clerkUser } = useClerkUser(); // Clerk user
  const { user: appUser, setUser } = useFrontUser(); // Tu propio user con ID

  const handleDeleteAccount = async () => {
    Alert.alert(
      "¿Eliminar cuenta?",
      "Esta acción no se puede deshacer",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              if (!appUser?.id) throw new Error("User ID no disponible");

              await deleteUser(appUser.id); // Llama al backend
              await clerkUser?.delete(); // Elimina en Clerk
              await signOut(); // Cierra sesión
            } catch (err) {
              console.error("Error al eliminar la cuenta:", err);
              Alert.alert("Error", "No se pudo eliminar la cuenta.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (!clerkUser || !appUser) return null;

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "bold" }}>Perfil</Text>
      <Text style={{ marginTop: 10 }}>ID Backend: {appUser.id}</Text>
      <Text>Email: {clerkUser.primaryEmailAddress?.emailAddress}</Text>
      <Text>Teléfono: {clerkUser.primaryPhoneNumber?.phoneNumber}</Text>

      <View style={{ marginTop: 20 }}>
        <SignOutButton />
      </View>

      <View style={{ marginTop: 10 }}>
        <Button
          title="Eliminar cuenta"
          onPress={handleDeleteAccount}
          color="red"
        />
      </View>
    </View>
  );
};

export default ProfileScreen;
