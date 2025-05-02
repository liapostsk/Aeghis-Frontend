// components/ui/ContinueButton.tsx
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

type Props = {
  onPress: () => void;
  text: string;
  disabled?: boolean;
};

export default function ContinueButton({ onPress, text, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, disabled && styles.disabled]}
      disabled={disabled}
    >
      <Text style={styles.text}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 300,
    height: 55,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: "#7A33CC",
    fontSize: 18,
    fontWeight: "bold",
  },
});
