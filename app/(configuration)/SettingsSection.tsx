// File: components/profile/SettingsSection.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function SettingsSection() {
  return (
    <SafeAreaView style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="settings" size={18} color="#7A33CC" />
        <Text style={styles.sectionTitle}>Configuración</Text>
      </View>

      <Pressable style={styles.settingItem}>
        <Ionicons name="notifications" size={24} color="#7A33CC" />
        <Text style={styles.settingText}>Notificaciones</Text>
        <Ionicons name="chevron-forward" size={24} color="#7A33CC" style={styles.chevron} />
      </Pressable>

      <Pressable
        style={styles.settingItem}
        onPress={() => router.push('/(configuration)/account')}
      >
        <Ionicons name="person-circle" size={24} color="#7A33CC" />
        <Text style={styles.settingText}>Cuenta</Text>
        <Ionicons name="chevron-forward" size={24} color="#7A33CC" />
      </Pressable>

      <Pressable style={styles.settingItem}>
        <Ionicons name="shield" size={24} color="#7A33CC" />
        <Text style={styles.settingText}>Privacidad y Seguridad</Text>
        <Ionicons name="chevron-forward" size={24} color="#7A33CC" style={styles.chevron} />
      </Pressable>

      <Pressable style={styles.settingItem}>
        <Ionicons name="help-circle" size={24} color="#7A33CC" />
        <Text style={styles.settingText}>Ayuda y Soporte</Text>
        <Ionicons name="chevron-forward" size={24} color="#7A33CC" style={styles.chevron} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  chevron: {
    marginLeft: 'auto',
  },
});