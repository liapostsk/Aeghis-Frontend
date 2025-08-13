// File: components/profile/EmergencyContactsSection.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import ContactEditorModal from '../ContactEditorModal';
import { EmergencyContact } from '@/api/types';
import { useTokenStore } from '../../lib/auth/tokenStore';
import { useAuth } from "@clerk/clerk-expo";
import { useUserStore } from '@/lib/storage/useUserStorage';
import { deleteEmergencyContact, editEmergencyContact } from '@/api/emergencyContacts/emergencyContactsApi';
import { createEmergencyContact } from '@/api/emergencyContacts/emergencyContactsApi';
import { getCurrentUser } from '@/api/user/userApi';
import EmergencyContactAddModal from '../EmergencyContactAddModal';


interface Props {
  contacts: EmergencyContact[];
}

export default function EmergencyContactsSection({ contacts }: Props) {
  // Estado para manejar la visibilidad del modal de editor
  const [editable, setEditable] = useState(false);
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null);

  const [modalEditorVisible, setModalEditorVisible] = useState(editable || false);
  const [modalAddVisible, setModalAddVisible] = useState(editable || false);

  const { user, setUser } = useUserStore.getState();

  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  // 🔥 Resetear estados cuando la screen pierde el foco
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // Esta función se ejecuta cuando la screen pierde el foco
        setEditable(false);
        setModalEditorVisible(false);
        setModalAddVisible(false);
        setSelectedContact(null);
      };
    }, [])
  );
  
  const handleEditContact = async (updated: EmergencyContact) => {
    const token = await getToken();
    setToken(token);
    await editEmergencyContact(updated.id!, updated); // tu función API PUT
    await getCurrentUser();
    await useUserStore.getState().refreshUserFromBackend();
  };

  const handleDeleteContact = async (contact: EmergencyContact) => {
    Alert.alert(
      "Eliminar Ubicación",
      `¿Estás seguro de que quieres eliminar "${contact.name}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          onPress: async () => {
            const token = await getToken();
            setToken(token);
            await deleteEmergencyContact(contact.id!); // tu función API DELETE
            await getCurrentUser();
            await useUserStore.getState().refreshUserFromBackend();
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleAddContact = async (contact: EmergencyContact) => {
    const token = await getToken();
    setToken(token);
    const id = await createEmergencyContact(contact);
    contact.id = id; // Asignar el ID devuelto al objeto de contacto
    await getCurrentUser();
    await useUserStore.getState().refreshUserFromBackend();
    
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <FontAwesome5 name="phone-alt" size={18} color="#7A33CC" />
        <Text style={styles.sectionTitle}>Contactos de Emergencia</Text>
          {contacts.length > 1 && (
            <Pressable style={styles.editButton} onPress={() => setEditable(!editable)}>
              <Text style={{ color: '#7A33CC' }}>Editar</Text>
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
          {editable && (
            <View style={styles.actionButtons}>
              {/* Botón de editar */}
              <Pressable 
                style={[styles.actionButton, styles.editActionButton]} 
                onPress={() => {
                  console.log("Editar contacto:", contact);
                  setSelectedContact(contact);
                  setModalEditorVisible(true);
                }}
              >
                <Feather name="edit-2" size={16} color="#7A33CC" />
              </Pressable>
              
              {/* Botón de eliminar */}
              <Pressable 
                style={[styles.actionButton, styles.deleteActionButton]} 
                onPress={() => handleDeleteContact(contact)}
              >
                <Feather name="trash-2" size={16} color="#ff4444" />
              </Pressable>
            </View>
          )}

        </View>
      ))}
      
      <Pressable style={styles.addButton} onPress={() => setModalAddVisible(true)}>
        <Ionicons name="add-circle" size={24} color="#7A33CC" />
        <Text style={styles.addButtonText}>Añadir contacto</Text>
      </Pressable>

      <ContactEditorModal
        visible={modalEditorVisible}
        contact={selectedContact || contacts[0]} 
        onClose={() => setModalEditorVisible(false)}
        onSave={handleEditContact}
        onDelete={() => handleDeleteContact(selectedContact!)}
      />

      <EmergencyContactAddModal
        visible={modalAddVisible}
        onClose={() => setModalAddVisible(false)}
        onAddContact={(contact) => {
          handleAddContact(contact);
        }}
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
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  editActionButton: {
    backgroundColor: '#f0f0ff',
  },
  deleteActionButton: {
    backgroundColor: '#fff0f0',
  },
});