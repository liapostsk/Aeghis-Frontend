import api from "@/api/client";
import { Group } from "./groupType";

export const createGroup = async (groupDto: Partial<Group>): Promise<number> => {
  try {
    const response = await api.post(`/groups`, groupDto);
    return response.data;
  } catch (error) {
    console.error('Error creando grupo:', error);
    throw error;
  }
};

export const getUserGroupsByType = async (type?: String): Promise<Group[]> => {
  try {
    const response = await api.get(`/groups`, {
      params: type ? { type } : {}
    });
    return response.data;
  } catch (error) {
    console.error('Error obteniendo grupos por tipo:', error);
    throw error;
  }
};

export const getUserGroups = async (): Promise<Group[]> => {
  try {
    const response = await api.get(`/groups`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo grupos del usuario:', error);
    throw error;
  }
};

export const joinGroup = async (userId: number, code: string): Promise<number> => {
  try {
    const response = await api.post("/groups/join", null, {
      params: { userId, code },
    });
    return response.data;
  } catch (error) {
    console.error('Error uniéndose al grupo:', error);
    throw error;
  }
};

export const getGroupById = async (groupId: number): Promise<Group> => {
  try {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo grupo ${groupId}:`, error);
    throw error;
  }
}

export const exitGroup = async (groupId: number, userId: number): Promise<Group> => {
  try {
    const response = await api.delete(`/groups/${groupId}/exit`, {
      params: { userId }
    });
    return response.data;
  } catch (error) {
    console.error(`Error saliendo del grupo ${groupId}:`, error);
    throw error;
  }
};

export const editGroup = async (groupId: number, groupDto: Partial<Group>): Promise<Group> => {
  try {
    const response = await api.put(`/groups/${groupId}`, groupDto);
    return response.data;
  } catch (error) {
    console.error(`Error editando grupo ${groupId}:`, error);
    throw error;
  }
};

export const deleteGroup = async (groupId: number): Promise<void> => {
  try {
    await api.delete(`/groups/${groupId}`);
  } catch (error) {
    console.error(`Error eliminando grupo ${groupId}:`, error);
    throw error;
  }
};

export const promoteToAdmin = async (groupId: number, userId: number): Promise<Group> => {
  try {
    const response = await api.post(`/groups/${groupId}/promote-admin/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error promoviendo usuario ${userId} a admin en grupo ${groupId}:`, error);
    throw error;
  }
};

export const demoteToMember = async (groupId: number, userId: number): Promise<Group> => {
  try {
    const response = await api.delete(`/groups/${groupId}/demote-admin/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error degradando admin ${userId} en grupo ${groupId}:`, error);
    throw error;
  }
};

export const removeMember = async (groupId: number, userId: number): Promise<void> => {
  try {
    await api.delete(`/groups/${groupId}/members/${userId}`);
  } catch (error) {
    console.error(`Error removiendo miembro ${userId} del grupo ${groupId}:`, error);
    throw error;
  }
};

export const addPhotoToGroup = async (groupId: number, photoUrl: string): Promise<void> => {
  try {
    console.log("API: Añadiendo foto al grupo:", groupId, photoUrl);
    await api.put(`/groups/${groupId}/image`, photoUrl, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error(`Error añadiendo foto al grupo ${groupId}:`, error);
    throw error;
  }
};

export const addMember = async (groupId: number, userId: number): Promise<Group> => {
  try {
    const response = await api.post(`/groups/${groupId}/members/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error añadiendo miembro ${userId} al grupo ${groupId}:`, error);
    throw error;
  }
};