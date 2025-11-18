import api from "../../client";
import { Group } from "./groupType";

export const createGroup = async (groupDto: Partial<Group>): Promise<number> => {
  const response = await api.post(`/group`, groupDto);
  return response.data;
};

export const getUserGroupsByType = async (type?: String): Promise<Group[]> => {
  const response = await api.get(`/group/${type}/my-groups`);
  return response.data;
};

export const getUserGroups = async (): Promise<Group[]> => {
  const response = await api.get(`/group/my-groups`);
  return response.data;
};

export const joinGroup = async (userId: number, code: string): Promise<number> => {
  const response = await api.post("/group/join", null, {
    params: { userId, code },
  });
  return response.data;
};

export const getGroupById = async (groupId: number): Promise<Group> => {
  const response = await api.get(`/group/${groupId}`);
  return response.data;
}

export const exitGroup = async (groupId: number, userId: number): Promise<Group> => {
  const response = await api.delete(`/group/${groupId}/exit`, {
    params: { userId }
  });
  return response.data;
};

export const editGroup = async (groupId: number, groupDto: Partial<Group>): Promise<Group> => {
  const response = await api.put(`/group/${groupId}`, groupDto);
  return response.data;
};

export const deleteGroup = async (groupId: number): Promise<void> => {
  await api.delete(`/group/${groupId}`);
};

/**
 * Promover un usuario a administrador del grupo
 * POST /group/{groupId}/promote-admin/{userId}
 */
export const promoteToAdmin = async (groupId: number, userId: number): Promise<Group> => {
  const response = await api.post(`/group/${groupId}/promote-admin/${userId}`);
  return response.data;
};

/**
 * Degradar un administrador a miembro regular
 * DELETE /group/{groupId}/demote-admin/{userId}
 */
export const demoteToMember = async (groupId: number, userId: number): Promise<Group> => {
  const response = await api.delete(`/group/${groupId}/demote-admin/${userId}`);
  return response.data;
};

/**
 * Remover un miembro del grupo (solo administradores)
 * DELETE /group/{groupId}/remove-member/{userId}
 */
export const removeMember = async (groupId: number, userId: number): Promise<void> => {
  await api.delete(`/group/${groupId}/remove-member/${userId}`);
};

export const addPhotoToGroup = async (groupId: number, photoUrl: string): Promise<void> => {
  await api.post(`/group/${groupId}/photo`, photoUrl, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
};