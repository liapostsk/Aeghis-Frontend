import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

type Contact = {
  id: string;
  name: string;
  phoneNumbers: { number: string }[];
};

type Props = {
  contacts: Contact[];
  onSelect: (contact: { name: string; phone: string }) => void;
  onCancel?: () => void;
};

export default function ContactList({ contacts, onSelect, onCancel }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.modalTitle}>Select a Contact</Text>
      
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <Pressable
            style={styles.item}
            onPress={() => onSelect({
              name: item.name,
              phone: item.phoneNumbers[0]?.number || ''
            })}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.phone}>{item.phoneNumbers[0]?.number}</Text>
          </Pressable>
        )}
      />
      
      {onCancel && (
        <Pressable onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Back</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  listContainer: {
    padding: 10,
  },
  item: {
    padding: 16,
    marginBottom: 10,
    backgroundColor: '#EEE',
    borderRadius: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  phone: {
    fontSize: 14,
    color: '#555',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 10,
  },
  cancelText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 16,
  }
});