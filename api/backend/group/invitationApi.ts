import api from "../../client";
import { Invitation } from "./groupType";

export const createInvitation = async (groupId: number, expiry?: number): Promise<Invitation> => {
    const params = expiry ? { expiry } : {};

    const response = await api.post(`/invitations/${groupId}/invite`, null, { params });

    console.log("Invitación creada:", response.data);
    return response.data;
};

export const validateInvitation = async (
  groupId: number,
  code: string
): Promise<boolean> => {
  const response = await api.post(
    `/invitations/${groupId}/validate`,
    null,
    { params: { code } }
  );
  return response.data;
};
