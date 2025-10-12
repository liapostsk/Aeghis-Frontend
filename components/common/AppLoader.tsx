// De momento no se usa, pero puede ser útil para futuras pantallas de carga
import React, { useEffect, useState } from 'react';
import LoadingScreen from './LoadingScreen';

interface AppLoaderProps {
  children: React.ReactNode;
  delay?: number; // ms
}

export default function AppLoader({ children, delay = 1500 }: AppLoaderProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simula una "pantalla de carga" temporal
    const timer = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (loading) return <LoadingScreen message="Preparando Aegis..." />;
  return <>{children}</>;
}
