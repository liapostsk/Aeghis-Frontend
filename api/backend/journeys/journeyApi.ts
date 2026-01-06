import api from "../../client";
import { JourneyDto, JourneyState } from "./journeyType";

export const getJourney = async (id: number): Promise<JourneyDto> => {
  const response = await api.get(`/journeys/${id}`);
  return response.data;
};

export const getCurrentJourneyForGroup = async (groupId: number): Promise<JourneyDto> => {
  const response = await api.get(`/journeys/current/${groupId}`);
  return response.data;
};

export const getActiveJourneys = async (): Promise<JourneyDto[]> => {
  const response = await api.get('/journeys/active');
  return response.data;
};

export const createJourney = async (journeyDto: JourneyDto): Promise<number> => {
  const response = await api.post('/journeys', journeyDto);
  return response.data;
};

export const updateJourney = async (journeyDto: JourneyDto): Promise<void> => {
  await api.put('/journeys', journeyDto);
};

export const changeJourneyStatus = async (
  journeyId: number,
  status: JourneyState
): Promise<void> => {
  await api.put(`/journeys/${journeyId}/status/${status}`);
  console.log(`Estado del journey ${journeyId} cambiado a: ${status}`);
};

export const deleteJourney = async (id: number): Promise<void> => {
  await api.delete(`/journeys/${id}`);
};

export const isUserParticipantInJourney = async (journeyId: number): Promise<boolean> => {
  const response = await api.get(`/journeys/${journeyId}/is-participant`);
  return response.data;
};

export const getJourneyParticipantIds = async (journeyId: number): Promise<number[]> => {
  const response = await api.get(`/journeys/${journeyId}/participants`);
  return response.data;
};

