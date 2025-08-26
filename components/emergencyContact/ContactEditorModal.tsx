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
} from 'react-native';
import { EmergencyContact } from '@/api/types';

type Props = {
  visible: boolean;
  contact: EmergencyContact;
  onClose: () => void;
  onSave: (contact: EmergencyContact) => void;
  onDelete?: () => void;
};

export default function ContactEditorModal({
  visible,
  contact,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');

  useEffect(() => {
    if (contact) {
      setName(contact.name ?? '');
      setPhone(contact.phone ?? '');
      setRelation(contact.relation ?? '');
    }
  }, [contact, visible]);

  const handleSave = () => {
    if (!name || !phone) return;

    const updated: EmergencyContact = {
      ...contact,
      name,
      phone,
      relation,
    };

    onSave(updated);
    onClose();
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
