import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { UserDto } from '@/api/backend/types';
import { Group } from '@/api/backend/group/groupType';
import { getGroupById } from '@/api/backend/group/groupApi';
import { getUser, getCurrentUser } from '@/api/backend/user/userApi';
import i18next from 'i18next';

interface UseGroupDataProps {
  groupId: string;
  getToken: () => Promise<string | null>;
  setToken: (token: string | null) => void;
}

export const useGroupData = ({ groupId, getToken, setToken }: UseGroupDataProps) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<UserDto[]>([]);
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadGroupData = async () => {
      try {
        setLoading(true);
        
        console.log('🔍 [useGroupData] Cargando grupo con ID:', groupId);
        
        // Obtener token
        const token = await getToken();
        setToken(token);

        // Validar groupId
        const id = Number(groupId);
        if (!groupId || groupId === 'undefined' || groupId === 'null' || Number.isNaN(id)) {
          console.error('[useGroupData] ID de grupo inválido:', groupId);
          throw new Error(`ID de grupo inválido: ${groupId}`);
        }

        console.log('[useGroupData] Obteniendo datos del grupo:', id);

        // Cargar grupo y usuario actual en paralelo
        const [groupData, userData] = await Promise.all([
          getGroupById(id),
          getCurrentUser()
        ]);

        if (!mounted) {
          console.log('[useGroupData] Componente desmontado, cancelando actualización');
          return;
        }

        console.log('[useGroupData] Grupo obtenido:', groupData.name);
        console.log('[useGroupData] Usuario actual:', userData.name);

        setGroup(groupData);
        setCurrentUser(userData);

        // Cargar miembros del grupo
        if (groupData.membersIds && groupData.membersIds.length > 0) {
          console.log(`👥 [useGroupData] Cargando ${groupData.membersIds.length} miembros...`);
          
          const memberPromises = groupData.membersIds.map(async (memberId) => {
            try {
              return await getUser(memberId);
            } catch (error) {
              console.warn(`[useGroupData] Error cargando miembro ${memberId}:`, error);
              return null;
            }
          });
          
          const loadedMembers = await Promise.all(memberPromises);
          const validMembers = loadedMembers.filter((m): m is UserDto => m !== null);
          
          if (mounted) {
            setMembers(validMembers);
            console.log(`[useGroupData] ${validMembers.length} miembros cargados`);
          }
        } else {
          console.log('useGroupData] No hay miembros en el grupo');
          setMembers([]);
        }

      } catch (error: any) {
        console.error('[useGroupData] Error cargando grupo:', error);
        
        if (mounted) {
          // Mensajes de error específicos
          let errorMessage = i18next.t('useGroupData.errors.loadFailed');
          
          if (error?.response?.status === 404) {
            errorMessage = i18next.t('useGroupData.errors.notFound');
          } else if (error?.response?.status === 401) {
            errorMessage = i18next.t('useGroupData.errors.noPermission');
          } else if (error?.message?.includes('Invalid group id') || error?.message?.includes('inválido')) {
            errorMessage = `${i18next.t('useGroupData.errors.invalidId')}: ${groupId}`;
          }
          
          Alert.alert(i18next.t('useGroupData.errors.title'), errorMessage);
          router.back();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadGroupData();
    return () => { mounted = false; };
  }, [groupId]);

  return {
    group,
    members,
    currentUser,
    loading,
  };
};
