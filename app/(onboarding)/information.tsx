import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, Alert } from 'react-native';
import PrivacyStep from '../../components/onboarding/PrivacyStep';
import ProfileImageStep from '../../components/onboarding/ProfileImageStep';
import EmergencyContactStep from '../../components/onboarding/EmergencyContactStep';
import SafeLocationStep from '../../components/onboarding/SafeLocationStep';
import SummaryStep from '../../components/onboarding/SummaryStep';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';

export default function InformationScreen() {
  const [step, setStep] = useState(0);
  const [loadingToken, setLoadingToken] = useState(true);

  const { getToken } = useAuth();
  const { setToken } = useTokenStore();

  useEffect(() => {
    const ensureValidToken = async () => {
      try {
        const freshToken = await getToken();
        if (!freshToken) {
          Alert.alert("Error", "No se pudo obtener el token. Inicia sesión de nuevo.");
          return;
        }
        setToken(freshToken);
        setLoadingToken(false);
      } catch (error) {
        console.error("Error obteniendo token:", error);
        Alert.alert("Error", "Error obteniendo token de sesión.");
      }
    };

    ensureValidToken();
  }, []);

  const next = () => setStep((s) => s + 1);
  const prev = () => setStep((s) => Math.max(0, s - 1));

  if (loadingToken) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {step === 0 && <PrivacyStep onNext={next} />}
      {step === 1 && <ProfileImageStep onNext={next} onBack={prev} />}
      {step === 2 && <EmergencyContactStep onNext={next} onBack={prev} />}
      {step === 3 && <SafeLocationStep onNext={next} onBack={prev} />}
      {step === 4 && <SummaryStep onBack={prev} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7A33CC',
    justifyContent: 'center',
  },
});
