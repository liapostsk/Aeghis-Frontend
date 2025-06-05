import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { useTokenStore } from "@/lib/auth/tokenStore";
import { View } from "react-native";

interface Props {
  children: React.ReactNode;
}

export default function TokenProvider({ children }: Props) {
  const { getToken, isSignedIn } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  useEffect(() => {
    let mounted = true;

    const loadToken = async () => {
      try {
        if (isSignedIn) {
          const token = await getToken();
          if (mounted) setToken(token);
        } else {
          if (mounted) setToken(null);
        }
      } catch (err) {
        console.warn("TokenProvider: error loading token", err);
        if (mounted) setToken(null);
      }
    };

    loadToken();

    return () => {
      mounted = false;
    };
  }, [isSignedIn]);

  return <View style={{ flex: 1 }}>{children}</View>;
}
