import React, { useState, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { useTranslation } from 'react-i18next';
import ProgressBar from '@/components/ui/ProgressBar';
import PrivacyStep from './PrivacyStep';
import ProfileImageStep from './ProfileImageStep';
import EmergencyContactStep from './EmergencyContactStep';
import SafeLocationStep from './SafeLocationStep';
import SummaryStep from './SummaryStep';

const TOTAL_STEPS = 5;

export default function InformationScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [loadingToken, setLoadingToken] = useState(false);

  const { getToken } = useAuth();
  const { setToken } = useTokenStore();

  useEffect(() => {
    const ensureValidToken = async () => {
      try {
        const freshToken = await getToken();
        if (!freshToken) {
          Alert.alert(t('infoForm.index.error'), t('infoForm.index.tokenError'));
          return;
        }
        setToken(freshToken);
        setLoadingToken(false);
      } catch (error) {
        console.error("Error obteniendo token:", error);
        Alert.alert(t('infoForm.index.error'), t('infoForm.index.tokenSessionError'));
      }
    };

    ensureValidToken();
  }, []);

  const next = () => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
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
    
        <View style={styles.progressContainer}>
          <ProgressBar 
            progress={(step + 1) / TOTAL_STEPS}
            height={6}
            backgroundColor="rgba(255, 255, 255, 0.3)"
            progressColor="#FFFFFF"
            showShadow={false}
          />
        </View>
        
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
  },
  contentContainer: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    zIndex: 1, // Asegura que esté por encima
  },
});