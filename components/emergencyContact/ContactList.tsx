import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Contact } from '@/api/backend/types';
import { useTranslation } from 'react-i18next';

type Props = {
  contacts: Contact[];
  onSelect: (contact: Contact) => void;
  onCancel?: () => void;
};

export default function ContactList({ contacts, onSelect, onCancel }: Props) {
  const { t } = useTranslation();
  
  return (
    <View style={styles.container}>
      <Text style={styles.modalTitle}>{t('emergencyContact.contactList.title')}</Text>
      
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.phone}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <Pressable
            style={styles.item}
            onPress={() => onSelect(item)}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.phone}>{item.phone}</Text>
          </Pressable>
        )}
      />
      
      {onCancel && (
        <Pressable onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>{t('emergencyContact.contactList.back')}</Text>
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