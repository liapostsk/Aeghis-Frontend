import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import GroupsList from '@/components/groups/GroupsList';
import GroupsButton from '@/components/groups/GrupsButton';

export default function TemporalGroups() {
  const load = () => {
    // Esta función se pasa al botón para recargar cuando se cree un grupo
    console.log('Recargando grupos temporales...');
  };

  return (
    <View style={styles.container}>
      <GroupsList
        groupType="TEMPORAL"
        emptyTitle="No temporal groups yet"
        emptySubtitle="Create one with the + button"
        noteText="All groups will be deleted 24h after finishing 🗑️"
      />
      <GroupsButton
        kind="TEMPORAL"
        onSuccess={load}
        style={styles.fab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 70,
    right: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },
});
