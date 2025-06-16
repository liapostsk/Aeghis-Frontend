import React from 'react';
import { View, StyleSheet } from 'react-native';

type Props = {
  progress: number; // valor entre 0 y 1
  height?: number; // altura personalizable
  backgroundColor?: string; // color de fondo personalizable
  progressColor?: string; // color de progreso personalizable
  borderRadius?: number; // radio de borde personalizable
  showShadow?: boolean; // mostrar sombra
};

export default function ProgressBar({ 
  progress, 
  height = 8,
  backgroundColor = '#F0F0F0',
  progressColor = '#7A33CC',
  borderRadius,
  showShadow = true
}: Props) {
  const calculatedBorderRadius = borderRadius ?? height / 2;
  
  return (
    <View style={[
      styles.container,
      {
        height,
        backgroundColor,
        borderRadius: calculatedBorderRadius,
        ...(showShadow && styles.shadow)
      }
    ]}>
      <View 
        style={[
          styles.progress, 
          { 
            width: `${Math.max(0, Math.min(100, progress * 100))}%`,
            backgroundColor: progressColor,
            borderRadius: calculatedBorderRadius,
          }
        ]} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    marginVertical: 8,
  },
  progress: {
    height: '100%',
    minWidth: 4, // ancho mínimo para que se vea algo de progreso
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});