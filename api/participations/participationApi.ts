import api from "../client";
import { Participation, ParticipationDto } from "./participationType";

/**
 * Obtiene una participación por su ID
 * GET /participation/{id}
 */
export const getParticipation = async (id: number): Promise<ParticipationDto> => {
  const response = await api.get(`/participation/${id}`);
  return response.data;
};

/**
 * Crea una nueva participación
 * POST /participation
 */
export const createParticipation = async (participation: ParticipationDto): Promise<number> => {
  const response = await api.post('/participation', participation);
  return response.data;
};

/**
 * Actualiza una participación existente
 * PUT /participation
 */
export const updateParticipation = async (participation: ParticipationDto): Promise<void> => {
  await api.put('/participation', participation);
};