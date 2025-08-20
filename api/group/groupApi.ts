import api from "../client";
import { Group } from "../types";

export const createGroup = async (groupDto: Partial<Group>): Promise<Group> => {
  const response = await api.post(`/group`, groupDto);
  return response.data;
};

export const getUserGroups = async (type?: String): Promise<Group[]> => {
  const response = await api.get(`/group/${type}`);
  return response.data;
};

export const joinGroup = async (groupId: number, userId: number, code: string): Promise<void> => {
  await api.post(`/group/${groupId}/join`, { userId, code });
}

export const leaveGroup = async (groupId: number, userId: number): Promise<void> => {
  await api.delete(`/group/${groupId}/leave`, { data: { userId } });
};