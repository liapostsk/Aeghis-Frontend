import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  SafeAreaView,
  Pressable,
} from 'react-native';
import privacyPolicyContent from '@/privacyPolicy.json';
import { useUserStore } from '@/lib/storage/useUserStorage';

type PrivacyPolicyScreenProps = {
  onNext?: () => void;
};

export default function PrivacyPolicyScreen({ onNext }: PrivacyPolicyScreenProps) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0]; // Animación de opacidad
  const scaleAnim = useState(new Animated.Value(0))[0]; // Animación de escala
  const { user, setUser } = useUserStore();
  
  const handleScroll = (event: { nativeEvent: { layoutMeasurement: { height: number }, contentOffset: { y: number }, contentSize: { height: number } } }) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= 
      contentSize.height - paddingToBottom;
      
    if (isCloseToBottom && !scrolledToBottom) {
      setScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    setAccepted(true);
    // 3. Guardamos el bool de aceptacion para usarlo más tarde
    setUser({ ...user, acceptedPrivacyPolicy: true });
    
    // Animación de aceptación
    Animated.parallel([ // ejecutar ambas animaciones al mismo tiempo
      Animated.timing(fadeAnim, { // con esto se dispara la animación de opacidad
        toValue: 1, // valor final de la opacidad, 1 es completamente visible
        duration: 300, 
        useNativeDriver: true, // usar el driver nativo para mejorar el rendimiento
      }),
      Animated.spring(scaleAnim, { // con esto se dispara la animación de escala
        toValue: 1, // valor final de la escala, 1 es el tamaño original
        friction: 8, // fricción de la animación, cuanto menor es el número, más rápido se detiene
        tension: 40, // tensión de la animación, cuanto mayor es el número, más rápido se mueve
        useNativeDriver: true,
      }),
    ]).start();
    
    // Llamar a onNext después de mostrar la animación
    setTimeout(() => {
      if (onNext) onNext(); // Llamar a la función onNext pasada como prop, pasa de pantalla
    }, 1500);
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        {/* Contenido principal */}
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Política de Privacidad</Text>
            <Text style={styles.subtitle}>Última actualización: {privacyPolicyContent.lastUpdated}</Text>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {/* Renderizar dinámicamente las secciones desde el JSON */}
            {privacyPolicyContent.sections.map((section, index) => (
              <View key={index}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.paragraph}>{section.content}</Text>
              </View>
            ))}
            
            {/* Renderizar los párrafos del pie */}
            {privacyPolicyContent.footerText.map((paragraph, index) => (
              <Text 
                key={`footer-${index}`} 
                style={[
                  styles.paragraph,
                  index === privacyPolicyContent.footerText.length - 1 ? { marginBottom: 40 } : {}
                ]}
              >
                {paragraph}
              </Text>
            ))}
          </ScrollView>

          <View style={styles.footerContainer}>
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusIndicator, 
                scrolledToBottom ? styles.statusIndicatorActive : {}
              ]} />
              <Text style={styles.statusText}>
                {scrolledToBottom ? 'Has revisado la política completa' : 'Por favor lee la política completa'}
              </Text>
            </View>
            
            <Pressable 
              style={[
                styles.button,
                !scrolledToBottom ? styles.buttonDisabled : {}
              ]}
              onPress={handleAccept}
              disabled={!scrolledToBottom}
            >
              <Text style={styles.buttonText}>
                {scrolledToBottom ? 'Aceptar y Continuar' : 'Desplázate hasta el final para aceptar'}
              </Text>
            </Pressable>
            
            <Text style={styles.footerText}>
              Al aceptar, confirmas que has leído y comprendido nuestra política de privacidad.
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Overlay de confirmación - FUERA del SafeAreaView */}
      {accepted && (
        <Animated.View 
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          {/* Transform es una lista de transformaciones por eso se pone asi*/}
          <Animated.View 
            style={[
              styles.confirmationBox,
              {
                transform: [{ scale: scaleAnim }],
              }
            ]}
          >
            <View style={styles.checkmarkCircle}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <Text style={styles.confirmationTitle}>¡Política aceptada!</Text>
            <Text style={styles.confirmationText}>Continuando con la aplicación...</Text>
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#7A33CC",
    paddingBottom: 70,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999, // Para Android
  },
  confirmationBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: width * 0.8,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  checkmarkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 36,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  confirmationText: {
    fontSize: 14,
    color: '#666666',
  },
  contentContainer: {
    flex: 1,
    margin: 15,
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
  },
  subtitle: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  scrollView: {
    flex: 1, // ocupar todo el espacio disponible
  },
  scrollViewContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    marginTop: 16,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666666',
    marginBottom: 16,
  },
  footerContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#CCCCCC',
    marginRight: 8,
  },
  statusIndicatorActive: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 12,
    color: '#999999',
  },
  button: {
    backgroundColor: '#7A33CC',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  footerText: {
    fontSize: 10,
    color: '#999999',
    textAlign: 'center',
    marginTop: 12,
  },
});