// File: components/profile/EmergencyContactsSection.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import ContactEditorModal from '../emergencyContact/ContactEditorModal';
import { Contact, EmergencyContact, EmergencyContactDto, ExternalContact } from '@/api/types';
import { useTokenStore } from '../../lib/auth/tokenStore';
import { useAuth } from "@clerk/clerk-expo";
import { useUserStore } from '@/lib/storage/useUserStorage';
import { 
  deleteEmergencyContact, 
  editEmergencyContact,
  createEmergencyContact 
} from '@/api/contacts/emergencyContactsApi';
import { 
  deleteExternalContact, 
  editExternalContact,
  createExternalContact 
} from '@/api/contacts/externalContactsApi';
import { checkIfUserExists, getCurrentUser } from '@/api/user/userApi';
import EmergencyContactAddModal from '../emergencyContact/EmergencyContactAddModal';
//import ExternalContactAddModal from '../emergencyContact/ExternalContactAddModal';

type ContactType = 'emergency' | 'external';

export default function EmergencyContactsSection() {

  // Obtener contactos de emergencia del usuario desde el store
  const { user, setUser } = useUserStore();
  const emergencyContacts = user?.emergencyContacts || [];
  const externalContacts = user?.externalContacts || [];

  console.log("📋 Contactos de emergencia:", emergencyContacts.length);
  console.log("📋 Contactos externos:", externalContacts.length);

  // Estados
  const [editable, setEditable] = useState(false);
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | ExternalContact | null>(null);
  const [selectedContactType, setSelectedContactType] = useState<ContactType>('emergency');
  const [modalEditorVisible, setModalEditorVisible] = useState(editable || false);
  const [modalAddVisible, setModalAddVisible] = useState(editable || false);
  //const [addContactType, setAddContactType] = useState<ContactType>('emergency');

  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  // Resetear estados cuando la screen pierde el foco
  useFocusEffect(
    React.useCallback(() => {
        console.log("External contacts:", externalContacts);
        console.log("user:", user);
      return () => {
        // Esta función se ejecuta cuando la screen pierde el foco
        setEditable(false);
        setModalEditorVisible(false);
        setModalAddVisible(false);
        setSelectedContact(null);
      };
    }, [])
  );
  
  // Funcion para refrescar los datos del usuario
  const refreshUserData = async () => {
    const data = await getCurrentUser();
          console.log("📡 Usuario actual desde backend:", data);
    await useUserStore.getState().refreshUserFromBackend();
  };

  // Handlers para ambos tipos de contacto
  const handleEditContact = async (updatedContact: Contact) => {
    try {
      const token = await getToken();
      setToken(token);

      if (selectedContactType === 'emergency') {
        // Crear objeto EmergencyContact completo
        const emergencyContact = selectedContact as EmergencyContact;
        const emergencyContactDto: EmergencyContactDto = {
          id: emergencyContact!.id!,
          ownerId: emergencyContact!.ownerId!,
          contactId: emergencyContact!.contactId,
          relation: updatedContact.relation || emergencyContact!.relation,
          status: emergencyContact!.status
        };
        console.log("📝 Editando relación de contacto de emergencia:", emergencyContactDto);
        await editEmergencyContact(selectedContact!.id!, emergencyContactDto);
      } else {
        // Crear objeto ExternalContact completo
        const externalContact = selectedContact as ExternalContact;
        const externalContactUpdate: ExternalContact = {
          id: externalContact!.id!,
          name: externalContact!.name,
          phone: externalContact!.phone,
          relation: externalContact!.relation,
        };
        console.log("Editando contacto externo:", externalContactUpdate);
        
        await editExternalContact(selectedContact!.id!, externalContactUpdate);
      }

      await refreshUserData();
      setModalEditorVisible(false);
      setSelectedContact(null);
    } catch (error) {
      console.error("Error editando contacto:", error);
      Alert.alert("Error", "No se pudo editar el contacto");
    }
  };

  const handleDeleteContact = async (contact: EmergencyContact | ExternalContact, type: ContactType) => {
    const contactType = type === 'emergency' ? 'Contacto de Emergencia' : 'Contacto Externo';
    
    Alert.alert(
      `Eliminar ${contactType}`,
      `¿Estás seguro de que quieres eliminar "${contact.name}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          onPress: async () => {
            try {
              const token = await getToken();
              setToken(token);
              
              console.log(`Eliminando ${contactType} con ID:`, contact.id);
              
              if (type === 'emergency') {
                await deleteEmergencyContact(contact.id!);
              } else {
                console.log("Eliminando contacto externo con ID:", contact.id);
                await deleteExternalContact(contact.id!);
              }
              
              await refreshUserData();
            } catch (error) {
              console.error(`Error eliminando ${contactType}:`, error);
              Alert.alert("Error", `No se pudo eliminar el ${contactType.toLowerCase()}`);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleAddContact = async (contactData: Contact) => {
    try {
      const token = await getToken();
      setToken(token);

      const existsUser = await checkIfUserExists(contactData.phone);
      console.log('Resultado de búsqueda de usuario:', existsUser);
      
      if (existsUser) {
        const newEmergencyContact: Partial<EmergencyContact> = {
          name: contactData.name || '',
          phone: contactData.phone,
          relation: contactData.relation || '',
          status: 'PENDING',
        };
        
        console.log('Creando contacto de emergencia:', newEmergencyContact);
        const contactId = await createEmergencyContact(newEmergencyContact as EmergencyContact);
        console.log('Contacto creado con ID:', contactId);
        refreshUserData();
      } else {
        const newExternalContactData = {
          name: contactData.name || '',
          phone: contactData.phone,
          relation: contactData.relation || '',
        };

        console.log('Creando contacto externo en backend:', newExternalContactData);

        // If createExternalContact expects ExternalContact, provide id as 0 or a dummy value
        const contactId = await createExternalContact({
          ...newExternalContactData,
          id: 0 // or any placeholder, backend should ignore/replace this
        });
        console.log('Contacto externo creado con ID:', contactId);

        const contactWithId = { ...newExternalContactData, id: contactId };

        const updatedExternalContacts = [
          ...(user?.externalContacts || []),
          contactWithId
        ];

        if (user) {
          setUser({
            ...user,
            externalContacts: updatedExternalContacts,
          });
        }
      }

      await refreshUserData();
      setModalAddVisible(false);
    } catch (error) {
      console.error("❌ Error añadiendo contacto:", error);
      Alert.alert("Error", "No se pudo añadir el contacto");
    }
  };

  const renderContactItem = (contact: EmergencyContact | ExternalContact, index: number, type: ContactType) => {
    const isEmergency = type === 'emergency';
    return (
      <View key={`${type}-${contact.id || index}`} style={styles.contactItem}>
        {/* Badge de tipo de contacto */}
        <View style={[styles.typeBadge, isEmergency ? styles.emergencyBadge : styles.externalBadge]}>
          <Text style={[styles.typeBadgeText, isEmergency ? styles.emergencyBadgeText : styles.externalBadgeText]}>
            {isEmergency ? 'APP' : 'EXT'}
          </Text>
        </View>

        {/* Icono del contacto */}
        <View style={[styles.contactIcon, isEmergency ? styles.emergencyIcon : styles.externalIcon]}>
          <Ionicons 
            name={isEmergency ? "person-circle" : "person"} 
            size={24} 
            color={isEmergency ? "#7A33CC" : "#666"} 
          />
        </View>

        {/* Información del contacto */}
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{contact.name}</Text>
          <Text style={styles.contactRelation}>{contact.relation}</Text>
          <Text style={styles.contactPhone}>{contact.phone}</Text>
          <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>ID: {contact.id}</Text>
          
          {/* Estado para contactos de emergencia */}
          {isEmergency && 'status' in contact && (
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusDot, 
                contact.status === 'CONFIRMED' ? styles.acceptedDot : 
                contact.status === 'PENDING' ? styles.pendingDot : styles.rejectedDot
              ]} />
              <Text style={styles.statusText}>
                {contact.status === 'CONFIRMED' ? 'Aceptado' : 
                 contact.status === 'PENDING' ? 'Pendiente' : 'Rechazado'}
              </Text>
            </View>
          )}
        </View>

        {/* Botones de acción */}
        {editable && (
          <View style={styles.actionButtons}>
            <Pressable 
              style={[styles.actionButton, styles.editActionButton]} 
              onPress={() => {
                setSelectedContact(contact);
                setSelectedContactType(type);
                setModalEditorVisible(true);
              }}
            >
              <Feather name="edit-2" size={16} color="#7A33CC" />
            </Pressable>
            
            <Pressable 
              style={[styles.actionButton, styles.deleteActionButton]} 
              onPress={() => handleDeleteContact(contact, type)}
            >
              <Feather name="trash-2" size={16} color="#ff4444" />
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  const totalContacts = emergencyContacts.length + externalContacts.length;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <FontAwesome5 name="phone-alt" size={18} color="#7A33CC" />
        <Text style={styles.sectionTitle}>Contactos de Emergencia</Text>
        {totalContacts > 0 && (
          <Pressable style={styles.editButton} onPress={() => setEditable(!editable)}>
            <Text style={styles.editButtonText}>
              {editable ? 'Hecho' : 'Editar'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Estado vacío */}
      {totalContacts === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="person-add" size={48} color="#ccc" />
          <Text style={styles.emptyTitle}>No hay contactos de emergencia</Text>
          <Text style={styles.emptySubtitle}>
            Añade contactos para que puedan ser notificados en caso de emergencia
          </Text>
        </View>
      ) : (
        <>
          {/* Leyenda */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendIcon, { backgroundColor: '#f0f0ff' }]}>
                <Ionicons name="person-circle" size={16} color="#7A33CC" />
              </View>
              <Text style={styles.legendText}>En la app ({emergencyContacts.length})</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIcon, { backgroundColor: '#f5f5f5' }]}>
                <Ionicons name="person-outline" size={16} color="#666" />
              </View>
              <Text style={styles.legendText}>Externos ({externalContacts.length})</Text>
            </View>
          </View>

          {/* Contactos de emergencia */}
          {emergencyContacts.map((contact, index) => 
            renderContactItem(contact, index, 'emergency')
          )}

          {/* Separador si hay ambos tipos */}
          {emergencyContacts.length > 0 && externalContacts.length > 0 && (
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>Contactos Externos</Text>
              <View style={styles.separatorLine} />
            </View>
          )}

          {/* Contactos externos */}
          {externalContacts.map((contact, index) => 
            renderContactItem(contact, index, 'external')
          )}
        </>
      )}
      
      {/* Botón añadir */}
      <Pressable style={styles.addButton} onPress={() => setModalAddVisible(true)}>
        <Ionicons name="add-circle" size={24} color="#7A33CC" />
        <Text style={styles.addButtonText}>Añadir contacto</Text>
      </Pressable>

      {/* Modales */}
      <ContactEditorModal
        visible={modalEditorVisible}
        contact={selectedContact} 
        isEmergencyContact={selectedContactType === 'emergency'}
        onClose={() => setModalEditorVisible(false)}
        onSave={handleEditContact}
        onDelete={() => {
          if (selectedContact) {
            handleDeleteContact(selectedContact, selectedContactType);
          }
        }}
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
    justifyContent: 'space-between',
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
    flex: 1,
  },
  editButton: {
    padding: 8,
    backgroundColor: '#f0f0ff',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#7A33CC',
    fontWeight: '600',
    fontSize: 14,
  },
  // Estado vacío
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  // Leyenda
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  // Separador
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  separatorText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  contactItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 30,
    alignItems: 'center',
  },
  emergencyBadge: {
    backgroundColor: '#E8D5FF',
  },
  externalBadge: {
    backgroundColor: '#F0F0F0',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emergencyBadgeText: {
    color: '#7A33CC',
  },
  externalBadgeText: {
    color: '#666',
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
  emergencyIcon: {
    backgroundColor: '#f0f0ff',
  },
  externalIcon: {
    backgroundColor: '#f5f5f5',
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  acceptedDot: {
    backgroundColor: '#4CAF50',
  },
  pendingDot: {
    backgroundColor: '#FF9800',
  },
  rejectedDot: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
});