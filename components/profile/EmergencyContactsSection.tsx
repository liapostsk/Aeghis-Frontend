// File: components/profile/EmergencyContactsSection.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import ContactEditorModal from '../ContactEditorModal';
import { EmergencyContact } from '@/api/types';
import { useTokenStore } from '../../lib/auth/tokenStore';
import { useAuth } from "@clerk/clerk-expo";
import { useUserStore } from '@/lib/storage/useUserStorage';
import { editEmergencyContact } from '@/api/emergencyContacts/emergencyContactsApi';
import { getCurrentUser } from '@/api/user/userApi';


interface Props {
  contacts: EmergencyContact[];
  editable?: boolean; 
}

export default function EmergencyContactsSection({ contacts, editable }: Props) {
  // Estado para manejar la visibilidad del modal de editor
  const [modalEditorVisible, setModalEditorVisible] = useState(editable || false);
  const [modalAddVisible, setModalAddVisible] = useState(editable || false);

  const { user, setUser } = useUserStore.getState();

  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);
  
  const handleEditContact = async (updated: EmergencyContact) => {
    const token = await getToken();
    setToken(token);
    await editEmergencyContact(updated.id!, updated); // tu función API PUT
    await getCurrentUser();
    await useUserStore.getState().refreshUserFromBackend();
  };

  // Arreglar
  const handleDeleteContact = async (updated: EmergencyContact) => {
    const token = await getToken();
    setToken(token);
    await editEmergencyContact(updated.id!, updated); // tu función API PUT
    await getCurrentUser();
    await useUserStore.getState().refreshUserFromBackend();
  };

  const handleAddContact = (contact: EmergencyContact) => {
    const { user, setUser } = useUserStore.getState();

    if (!contact.name || !contact.phone) {
      console.warn('Faltan datos del contacto');
      return;
    }

    if (!user) {
      console.error('No hay usuario en el store');
      return;
    }

    const updatedContacts = [...(user.emergencyContacts || []), contact];

    setUser({
      ...user,
      emergencyContacts: updatedContacts,
    });

    console.log('📞 Contacto agregado:', contact);
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <FontAwesome5 name="phone-alt" size={18} color="#7A33CC" />
        <Text style={styles.sectionTitle}>Contactos de Emergencia</Text>
        {editable && (
          <Pressable style={styles.editButton } onPress={() => setModalEditorVisible(true)}>
            <Feather name="edit-2" size={18} color="#7A33CC" />
          </Pressable>
        )}
      </View>

      {contacts.map((contact, index) => (
        <View key={index} style={styles.contactItem}>
          <View style={styles.contactIcon}>
            <Ionicons name="person" size={24} color="#7A33CC" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{contact.name}</Text>
            <Text style={styles.contactRelation}>{contact.relation}</Text>
            <Text style={styles.contactPhone}>{contact.phone}</Text>
          </View>
        </View>
      ))}

      <Pressable style={styles.addButton} onPress={() => setModalAddVisible(true)}>
        <Ionicons name="add-circle" size={24} color="#7A33CC" />
        <Text style={styles.addButtonText}>Añadir contacto</Text>
      </Pressable>

      <ContactEditorModal
        visible={modalEditorVisible}
        initialData={contacts[0]} // Puedes pasar un contacto específico o dejarlo vacío
        onClose={() => setModalEditorVisible(false)}
        onSave={handleEditContact}
        onDelete={() => handleDeleteContact(contacts[0])} // Puedes pasar un contacto específico o dejarlo vacío
      />
      <ContactEditorModal
        visible={modalAddVisible}
        onClose={() => setModalAddVisible(false)}
        onSave={handleAddContact}
      />


    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    margin: 16,
    marginTop: 8,
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
  contactItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactRelation: {
    fontSize: 14,
    color: '#666',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  editButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 10,
  },
  addButtonText: {
    color: '#7A33CC',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
});