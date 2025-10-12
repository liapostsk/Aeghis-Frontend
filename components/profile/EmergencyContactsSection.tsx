import React, { useState, useEffect } from 'react';
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
import { checkIfUserExists, getCurrentUser, getUser } from '@/api/user/userApi';
import EmergencyContactAddModal from '../emergencyContact/EmergencyContactAddModal';

type ContactType = 'emergency' | 'external';
type TabType = 'app' | 'external';

export default function EmergencyContactsSection() {

  // Obtener contactos de emergencia del usuario desde el store
  const { user } = useUserStore();
  const emergencyContacts = user?.emergencyContacts || [];
  const externalContacts = user?.externalContacts || [];

  // Estados
  const [activeTab, setActiveTab] = useState<TabType>('app');
  const [editable, setEditable] = useState(false);
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | ExternalContact | null>(null);
  const [selectedContactType, setSelectedContactType] = useState<ContactType>('emergency');
  const [modalEditorVisible, setModalEditorVisible] = useState(false);
  const [modalAddVisible, setModalAddVisible] = useState(false);
  const [emergencyContactsData, setEmergencyContactsData] = useState<{ [contactId: number]: any }>({});

  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  const isEmptyOrNull = (value: any): boolean => {
    return value == null || value === "" || value === "null" || value === "undefined";
  };

  // Cargar datos de contactos de emergencia cuando cambien
  useEffect(() => {
    if (emergencyContacts.length > 0) {
      loadEmergencyContactsData();
    }
  }, [emergencyContacts]);

  // Resetear estados cuando la screen pierde el foco
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setEditable(false);
        setModalEditorVisible(false);
        setModalAddVisible(false);
        setSelectedContact(null);
      };
    }, [])
  );
  
  // Función para refrescar los datos del usuario
  const refreshUserData = async () => {
    await useUserStore.getState().refreshUserFromBackend();
    // Después de refrescar, cargar los datos de los contactos de emergencia
    await loadEmergencyContactsData();
  };

  // Función para obtener los datos actualizados de los contactos de emergencia
  const loadEmergencyContactsData = async () => {
    try {
      const token = await getToken();
      setToken(token);

      const contactsData: { [contactId: number]: any } = {};
      
      for (const contact of emergencyContacts) {
        if (contact.contactId && !contactsData[contact.contactId]) {
          try {
            const userData = await getUser(contact.contactId);
            contactsData[contact.contactId] = userData;
          } catch (error) {
            console.error(`Error obteniendo datos del usuario ${contact.contactId}:`, error);
          }
        }
      }
      
      setEmergencyContactsData(contactsData);
    } catch (error) {
      console.error("Error cargando datos de contactos de emergencia:", error);
    }
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
          id: emergencyContact.id!,
          ownerId: emergencyContact.ownerId!,
          contactId: emergencyContact.contactId,
          relation: updatedContact.relation || emergencyContact.relation,
          status: emergencyContact.status
        };
        await editEmergencyContact(selectedContact.id!, emergencyContactDto);
      } else {
        const externalContact = selectedContact as ExternalContact;
        const externalContactUpdate: ExternalContact = {
          id: externalContact.id!,
          name: externalContact.name,
          phone: externalContact.phone,
          relation: externalContact.relation,
        };
        await editExternalContact(selectedContact.id!, externalContactUpdate);
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
              
              if (type === 'emergency') {
                await deleteEmergencyContact(contact.id!);
              } else {
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

      const existsUserId = await checkIfUserExists(contactData.phone);
      
      if (!isEmptyOrNull(existsUserId)) {
        const newEmergencyContact: Partial<EmergencyContact> = {
          name: contactData.name || '',
          phone: contactData.phone,
          contactId: existsUserId,
          relation: contactData.relation || '',
          status: 'PENDING',
        };
        
        const emergencyContact = await createEmergencyContact(newEmergencyContact as EmergencyContact);
      } else {
        const newExternalContactData = {
          name: contactData.name || '',
          phone: contactData.phone,
          relation: contactData.relation || '',
        };

        await createExternalContact({
          ...newExternalContactData,
          id: 0
        });
      }

      await refreshUserData();
      setModalAddVisible(false);
    } catch (error) {
      Alert.alert("Error", "No se pudo añadir el contacto");
    }
  };

  const renderContactItem = (contact: EmergencyContact | ExternalContact, index: number, type: ContactType) => {
    const isEmergency = type === 'emergency';
    
    // Para contactos de emergencia, usar datos actualizados del usuario si están disponibles
    let displayName = contact.name;
    let displayPhone = contact.phone;
    
    if (isEmergency && 'contactId' in contact && contact.contactId) {
      const userData = emergencyContactsData[contact.contactId];
      if (userData) {
        displayName = userData.name || contact.name;
        displayPhone = userData.phone || contact.phone;
      }
    }
    
    return (
      <View key={`${type}-${contact.id || index}`} style={styles.contactItem}>
        {/* Badge de tipo de contacto */}
        <View style={[styles.typeBadge, isEmergency ? styles.emergencyBadge : styles.externalBadge]}>
          <Text style={[styles.typeBadgeText, isEmergency ? styles.emergencyBadgeText : styles.externalBadgeText]}>
            {isEmergency ? 'APP' : 'EXT'}
          </Text>
        </View>

        {/* Badge de estado para contactos de emergencia */}
        {isEmergency && 'status' in contact && (
          <View style={[
            styles.statusBadge,
            contact.status === 'CONFIRMED' ? styles.statusAccepted : 
            contact.status === 'PENDING' ? styles.statusPending : styles.statusRejected
          ]}>
            <View style={[
              styles.statusDot, 
              contact.status === 'CONFIRMED' ? styles.acceptedDot : 
              contact.status === 'PENDING' ? styles.pendingDot : styles.rejectedDot
            ]} />
            <Text style={[
              styles.statusBadgeText,
              contact.status === 'CONFIRMED' ? styles.statusAcceptedText : 
              contact.status === 'PENDING' ? styles.statusPendingText : styles.statusRejectedText
            ]}>
              {contact.status === 'CONFIRMED' ? 'Aceptado' : 
               contact.status === 'PENDING' ? 'Pendiente' : 'Rechazado'}
            </Text>
          </View>
        )}

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
          <Text style={styles.contactName}>{displayName}</Text>
          <Text style={styles.contactRelation}>{contact.relation}</Text>
          <Text style={styles.contactPhone}>{displayPhone}</Text>
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

      {/* Pestañas */}
      {totalContacts > 0 && (
        <View style={styles.tabContainer}>
          <Pressable 
            style={[styles.tab, activeTab === 'app' && styles.activeTab]} 
            onPress={() => setActiveTab('app')}
          >
            <Ionicons 
              name="person-circle" 
              size={20} 
              color={activeTab === 'app' ? '#7A33CC' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'app' && styles.activeTabText]}>
              En la app ({emergencyContacts.length})
            </Text>
          </Pressable>
          
          <Pressable 
            style={[styles.tab, activeTab === 'external' && styles.activeTab]} 
            onPress={() => setActiveTab('external')}
          >
            <Ionicons 
              name="person-outline" 
              size={20} 
              color={activeTab === 'external' ? '#7A33CC' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'external' && styles.activeTabText]}>
              Externos ({externalContacts.length})
            </Text>
          </Pressable>
        </View>
      )}

      {/* Contenido según la pestaña activa */}
      {totalContacts === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="person-add" size={48} color="#ccc" />
          <Text style={styles.emptyTitle}>No hay contactos de emergencia</Text>
          <Text style={styles.emptySubtitle}>
            Añade contactos para que puedan ser notificados en caso de emergencia
          </Text>
        </View>
      ) : (
        <View style={styles.tabContent}>
          {activeTab === 'app' ? (
            /* Contactos de emergencia (en la app) */
            emergencyContacts.length === 0 ? (
              <View style={styles.emptyTabState}>
                <Ionicons name="phone-portrait" size={36} color="#ccc" />
                <Text style={styles.emptyTabTitle}>Sin contactos en la app</Text>
                <Text style={styles.emptyTabSubtitle}>
                  Añade contactos que usen la aplicación para mayor funcionalidad
                </Text>
              </View>
            ) : (
              emergencyContacts.map((contact, index) => 
                renderContactItem(contact, index, 'emergency')
              )
            )
          ) : (
            /* Contactos externos */
            externalContacts.length === 0 ? (
              <View style={styles.emptyTabState}>
                <Ionicons name="call" size={36} color="#ccc" />
                <Text style={styles.emptyTabTitle}>Sin contactos externos</Text>
                <Text style={styles.emptyTabSubtitle}>
                  Añade contactos para llamadas tradicionales de emergencia
                </Text>
              </View>
            ) : (
              externalContacts.map((contact, index) => 
                renderContactItem(contact, index, 'external')
              )
            )
          )}
        </View>
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
    marginTop: 1,
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
  // Badge de estado prominente
  statusBadge: {
    position: 'absolute',
    top: 30,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
    justifyContent: 'center',
  },
  statusAccepted: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  statusRejected: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
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
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusAcceptedText: {
    color: '#2E7D32',
  },
  statusPendingText: {
    color: '#F57C00',
  },
  statusRejectedText: {
    color: '#C62828',
  },
  // Estilos de pestañas
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#7A33CC',
    fontWeight: '600',
  },
  tabContent: {
    minHeight: 100,
  },
  // Estados vacíos de pestañas
  emptyTabState: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyTabTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptyTabSubtitle: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});