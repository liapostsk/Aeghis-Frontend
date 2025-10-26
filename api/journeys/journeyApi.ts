import api from "../client";
import { Journey, JourneyDto } from "./journeyType";

/**
 * Obtiene un journey por su ID
 * GET /journey/{id}
 */
export const getJourney = async (id: number): Promise<JourneyDto> => {
  const response = await api.get(`/journey/${id}`);
  return response.data;
};

/**
 * Obtiene el journey actual para un grupo específico
 * GET /journey/current/{groupId}
 */
export const getCurrentJourneyForGroup = async (groupId: number): Promise<JourneyDto> => {
  const response = await api.get(`/journey/current/${groupId}`);
  return response.data;
};

/**
 * Obtiene todos los journeys activos
 * GET /journey/active
 */
export const getActiveJourneys = async (): Promise<JourneyDto[]> => {
  const response = await api.get('/journey/active');
  return response.data;
};

/**
 * Crea un nuevo journey
 * POST /journey/create
 */
export const createJourney = async (journeyDto: JourneyDto): Promise<number> => {
  const response = await api.post('/journey/create', journeyDto);
  return response.data;
};

/**
 * Actualiza un journey existente
 * PUT /journey/update
 */
export const updateJourney = async (journeyDto: JourneyDto): Promise<void> => {
  await api.put('/journey/update', journeyDto);
};

/**
 * Elimina un journey por su ID
 * DELETE /journey/{id}
 */
export const deleteJourney = async (id: number): Promise<void> => {
  await api.delete(`/journey/${id}`);
};