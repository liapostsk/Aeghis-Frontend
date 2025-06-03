import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  onStartJourney: () => void;
}

export default function JourneyOverlay({ onStartJourney }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        You're currently not on a trip. Activate one if you'd like someone to keep an eye on you 😊
      </Text>
      <TouchableOpacity style={styles.button} onPress={onStartJourney}>
        <Text style={styles.buttonText}>Start a journey</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
