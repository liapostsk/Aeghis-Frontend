import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { UserDto } from '@/api/backend/types';
import { Group } from '@/api/backend/group/groupType';
import { getGroupById } from '@/api/backend/group/groupApi';
import { getUser, getCurrentUser } from '@/api/backend/user/userApi';

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
        const token = await getToken();
        setToken(token);

        const id = Number(groupId);
        if (!id || Number.isNaN(id)) {
          throw new Error('Invalid group id');
        }

        const [groupData, userData] = await Promise.all([
          getGroupById(id),
          getCurrentUser()
        ]);

        if (!mounted) return;

        setGroup(groupData);
        setCurrentUser(userData);

        const memberPromises = groupData.membersIds.map(memberId => getUser(memberId));
        const loadedMembers = await Promise.all(memberPromises);
        setMembers(loadedMembers);

      } catch (error) {
        console.error('Error loading group:', error);
        Alert.alert('Error', 'No se pudo cargar la información del grupo');
        router.back();
      } finally {
        if (mounted) setLoading(false);
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
