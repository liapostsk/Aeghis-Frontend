import React from 'react';
import { View, StyleSheet } from 'react-native';
import GroupsList from '@/components/groups/GroupsList';
import GroupsButton from '@/components/groups/GrupsButton';
import { useTranslation } from 'react-i18next';

export default function TrustedScreen() {
  const { t } = useTranslation();
  const load = () => {
    // Esta función se pasa al botón para recargar cuando se cree un grupo
    console.log('Recargando grupos de confianza...');
  };

  return (
    <View style={styles.container}>
      <GroupsList
        groupType="CONFIANZA"
        emptyTitle={t('groups.confianza.emptyTitle')}
        emptySubtitle={t('groups.confianza.emptySubtitle')}
        noteText={t('groups.confianza.noteText')}
      />
      <GroupsButton
        kind="CONFIANZA"
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
