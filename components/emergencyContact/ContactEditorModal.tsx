import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { EmergencyContact, ExternalContact, Contact } from '@/api/types';

type Props = {
  visible: boolean;
  contact: EmergencyContact | ExternalContact | null;
  isEmergencyContact?: boolean;
  onClose: () => void;
  onSave: (contact: Contact) => void;
  onDelete?: () => void;
};

export default function ContactEditorModal({
  visible,
  contact,
  isEmergencyContact = false,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');

  // Campos editables
  const isNameEditable = !isEmergencyContact;
  const isPhoneEditable = !isEmergencyContact;
  const isRelationEditable = true; // Siempre editable

  useEffect(() => {
    if (contact) {
      setName(contact.name ?? '');
      setPhone(contact.phone ?? '');
      setRelation(contact.relation ?? '');
    }
    else {
      setName('');
      setPhone('');
      setRelation('');
    }
  }, [contact, visible]);

  const handleSave = () => {
    if (isEmergencyContact) {
      // Para contactos de emergencia, solo validar relación
      if (!relation.trim()) {
        Alert.alert('Error', 'La relación es obligatoria');
        return;
      }
    } else {
      // Para contactos externos, validar todos los campos
      if (!name.trim() || !phone.trim()) {
        Alert.alert('Error', 'El nombre y teléfono son obligatorios');
        return;
      }
    }

    const updatedContact: Contact = {
      phone: isPhoneEditable ? phone.trim() : contact?.phone || '',
      name: isNameEditable ? name.trim() : contact?.name,
      relation: relation.trim(),
    };

    console.log('Guardando contacto:', updatedContact);
    console.log('Tipo de contacto:', isEmergencyContact ? 'Emergency' : 'External');

    onSave(updatedContact);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <View style={styles.modal}>
            <Text style={styles.title}>Editar contacto</Text>
          {}
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Teléfono"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Relación"
              value={relation}
              onChangeText={setRelation}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.saveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelText: {
    color: '#888',
    fontSize: 16,
  },
  saveText: {
    color: '#7A33CC',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteText: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
