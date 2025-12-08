import api from "../../client";
import { CompanionRequestDto } from "../types";
import { JourneyDto } from "../journeys/journeyType";

export const createCompanionRequest = async (dto: CompanionRequestDto): Promise<number> => {
  console.log(" API: Creando solicitud de acompañamiento:", dto);
  const response = await api.post("/companion-request", dto);
  console.log(" API: Respuesta de creación:", response.data);
  return response.data;
};

export const acceptCompanionRequest = async (id: number): Promise<CompanionRequestDto> => {
  console.log(" API: Aceptando solicitud de acompañamiento:", id);
  const response = await api.post(`/companion-request/${id}/accept`);
  console.log(" API: Solicitud aceptada:", response.data);
  return response.data;
};

export const rejectCompanionRequest = async (id: number): Promise<void> => {
  console.log(" API: Rechazando solicitud de acompañamiento:", id);
  await api.post(`/companion-request/${id}/reject`);
  console.log(" API: Solicitud rechazada");
};

export const deleteCompanionRequest = async (id: number): Promise<void> => {
  console.log(" API: Eliminando solicitud de acompañamiento:", id);
  await api.delete(`/companion-request/${id}`);
  console.log(" API: Solicitud eliminada");
};

export const finishCompanionRequest = async (id: number): Promise<CompanionRequestDto> => {
  console.log(" API: Finalizando solicitud de acompañamiento:", id);
  const response = await api.post(`/companion-request/${id}/finish`);
  console.log(" API: Solicitud finalizada:", response.data);
  return response.data;
};

export const submitIndividualJourney = async (id: number, journeyDto: JourneyDto): Promise<CompanionRequestDto> => {
  console.log(" API: Creando trayecto individual para acompañante:", id, journeyDto);
  const response = await api.post(`/companion-request/${id}/submit-journey`, journeyDto);
  console.log(" API: Trayecto individual creado:", response.data);
  return response.data;
};

/**
 * Endpoint for the searchers
 */

export const getMyCompanionRequests = async (): Promise<CompanionRequestDto[]> => {
  console.log(" API: Obteniendo mis solicitudes de acompañamiento");
  const response = await api.get("/companion-request/my-requests");
  console.log(" API: Mis solicitudes:", response.data);
  return response.data;
};

export const listActiveCompanionRequests = async (): Promise<CompanionRequestDto[]> => {
  console.log(" API: Listando solicitudes activas de acompañamiento");
  const response = await api.get("/companion-request/available");
  console.log(" API: Solicitudes activas:", response.data);
  return response.data;
};

export const searchCompanionRequests = async (
  destinoId?: number,
  from?: string,
  to?: string,
  excludeMine: boolean = true
): Promise<CompanionRequestDto[]> => {
  console.log(" API: Buscando solicitudes de acompañamiento con criterios:", { destinoId, from, to, excludeMine });
  const params = new URLSearchParams();
  
  if (destinoId !== undefined) {
    params.append('destinoId', destinoId.toString());
  }
  if (from) {
    params.append('from', from);
  }
  if (to) {
    params.append('to', to);
  }
  params.append('excludeMine', excludeMine.toString());
  
  const response = await api.get(`/companion-request/search?${params.toString()}`);
  console.log(" API: Solicitudes encontradas:", response.data);
  return response.data;
};

export const requestToJoinCompanionRequest = async (id: number): Promise<void> => {
  console.log(" API: Solicitando unirse a solicitud de acompañamiento:", id);
  await api.post(`/companion-request/${id}/request-join`);
  console.log(" API: Solicitud de unión enviada");
};

export const cancelCompanionRequest = async (id: number): Promise<void> => {
  console.log(" API: Cancelando solicitud de acompañamiento:", id);
  await api.post(`/companion-request/${id}/request-join/cancel`);
  console.log(" API: Solicitud cancelada");
};

/**
 * Endpoint for both the creator and the searcher
 */

export const getCompanionRequestById = async (id: number): Promise<CompanionRequestDto> => {
  console.log(" API: Obteniendo solicitud de acompañamiento por ID:", id);
  const response = await api.get(`/companion-request/${id}`);
  console.log(" API: Solicitud obtenida:", response.data);
  return response.data;
};
