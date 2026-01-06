import api from "../../client";
import { ParticipationDto } from "./participationType";

export const getParticipation = async (id: number): Promise<ParticipationDto> => {
  const response = await api.get(`/participations/${id}`);
  return response.data;
};

export const createParticipation = async (participation: ParticipationDto): Promise<number> => {
  const response = await api.post('/participations', participation);
  return response.data;
};

export const updateParticipation = async (participation: ParticipationDto): Promise<void> => {
  await api.put('/participations', participation);
};