// components/groups/GroupsFab.tsx
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GroupActionModal from '@/components/groups/GroupActionModal';
import CreateGroupModal from '@/components/groups/CreateGroupModal';
import JoinGroupModal from '@/components/groups/JoinGroupModal';
import { usePathname } from 'expo-router';

type Kind = 'confianza' | 'temporal' | 'companion';

function kindFromPath(pathname: string): Kind {
  if (pathname.endsWith('/temporal'))   return 'temporal';
  if (pathname.endsWith('/companion'))  return 'companion';
  return 'confianza'; // index (/groups)
}

type Props = {
  /** Opcional: si no lo pasas, se deduce de la ruta actual */
  kind?: Kind;
  /** Llamado tras crear/unirse con éxito para refrescar la lista */
  onSuccess?: () => void;
  /** Opcional: override de estilos del FAB */
  style?: any;
};

export default function GroupsButton({ kind, onSuccess, style }: Props) {
  const pathname = usePathname();
  const currentKind = useMemo(() => kind ?? kindFromPath(pathname), [kind, pathname]);

  const [showAction, setShowAction] = useState(false);
  const [isCreating, setCreating]   = useState(false);
  const [isJoining, setJoining]     = useState(false);

  // Mapear al tipo que esperan tus modales/API
  const modalType = currentKind; // 'confianza' | 'temporal' | 'companion'

  const handleCreateSuccess = () => {
    console.log('🎉 GroupsButton: Grupo creado exitosamente');
    setCreating(false);
    if (onSuccess) {
      console.log('🔄 GroupsButton: Ejecutando onSuccess callback...');
      onSuccess();
    }
  };

  const handleJoinSuccess = () => {
    console.log('🎉 GroupsButton: Se unió al grupo exitosamente');
    setJoining(false);
    if (onSuccess) {
      console.log('🔄 GroupsButton: Ejecutando onSuccess callback...');
      onSuccess();
    }
  };

  return (
    <>
      {/* FAB */}
      <Pressable style={[styles.fab, style]} onPress={() => setShowAction(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      {/* Selector: crear o unirse */}
      <GroupActionModal
        visible={showAction}
        onClose={() => setShowAction(false)}
        onCreateGroup={() => { setShowAction(false); setCreating(true); }}
        onJoinGroup={() => { setShowAction(false); setJoining(true); }}
      />

      {/* Crear grupo del tipo actual */}
      {isCreating && (
        <CreateGroupModal
          visible={isCreating}
          onClose={() => setCreating(false)}
          onSuccess={handleCreateSuccess}
          type={modalType}
        />
      )}

      {/* Unirse a grupo */}
      <JoinGroupModal
        visible={isJoining}
        onClose={() => setJoining(false)}
        onSuccess={handleJoinSuccess}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    backgroundColor: '#F5C80E',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
