import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeLocation } from "@/api/types";

type Props = {
  visible: boolean;
  locations: SafeLocation[];
  onClose: () => void;
  onSave: (updated: SafeLocation) => void;
};

export default function EditItemModal({ visible, locations, onClose, onSave }: Props) {
  const [editingId, setEditingId] = useState<number | undefined>();
  const [editedValues, setEditedValues] = useState<Partial<SafeLocation>>({});

  const startEditing = (location: SafeLocation) => {
    setEditingId(location.id);
    setEditedValues({ name: location.name, type: location.type });
  };

  const handleSave = () => {
    if (editingId !== undefined) {
      const updated = {
        ...locations.find((loc) => loc.id === editingId),
        ...editedValues,
      } as SafeLocation;

      onSave(updated);
      setEditingId(undefined);
      setEditedValues({});
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Editar Ubicaciones</Text>

          <FlatList
            data={locations}
            keyExtractor={(item) => item.id?.toString() || item.externalId || item.name}
            renderItem={({ item }) => (
              <View style={styles.itemContainer}>
                <TouchableOpacity onPress={() => startEditing(item)}>
                  <Text style={styles.itemTitle}>{item.name}</Text>
                  <Text style={styles.itemSubtitle}>{item.type}</Text>
                </TouchableOpacity>

                {editingId === item.id && (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Nuevo nombre"
                      value={editedValues.name}
                      onChangeText={(text) =>
                        setEditedValues((prev) => ({ ...prev, name: text }))
                      }
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Nuevo tipo"
                      value={editedValues.type}
                      onChangeText={(text) =>
                        setEditedValues((prev) => ({ ...prev, type: text }))
                      }
                    />
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                      <Text style={styles.saveText}>Guardar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          />

          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  itemContainer: {
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingVertical: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  itemSubtitle: {
    color: "#666",
    fontSize: 14,
  },
  editContainer: {
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: "#7A33CC",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  saveText: {
    color: "white",
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 20,
    alignItems: "center",
  },
  cancelText: {
    color: "#888",
    fontSize: 16,
  },
});
