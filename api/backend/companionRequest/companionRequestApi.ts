import api from "../../client";
import { CompanionRequestDto, CreateCompanionRequestDto, RequestStatus } from '@/api/backend/companionRequest/companionTypes';

export const createCompanionRequest = async (dto: CreateCompanionRequestDto): Promise<number> => {
  console.log(" API: Creando solicitud de acompañamiento:", dto);
  const response = await api.post("/companion-requests", dto);
  console.log(" API: Respuesta de creación:", response.data);
  return response.data;
};

export const changeCompanionRequestStatus = async (id: number, status: RequestStatus): Promise<CompanionRequestDto> => {
  console.log(" API: Cambiando estado de solicitud de acompañamiento:", id, status);
  const response = await api.put(`/companion-requests/${id}/status/${status}`);
  console.log(" API: Estado cambiado:", response.data);
  return response.data;
};

export const deleteCompanionRequest = async (id: number): Promise<void> => {
  console.log(" API: Eliminando solicitud de acompañamiento:", id);
  await api.delete(`/companion-requests/${id}`);
  console.log(" API: Solicitud eliminada");
};

export const editCompanionRequest = async (id: number, dto: CreateCompanionRequestDto): Promise<CompanionRequestDto> => {
  console.log("API: Editando solicitud de acompañamiento:", id, dto);
  const response = await api.put(`/companion-requests/${id}`, dto);
  console.log("API: Solicitud editada:", response.data);
  return response.data;
};

/**
 * Endpoint for the searchers
 */

export const getMyCompanionRequests = async (): Promise<CompanionRequestDto[]> => {
  console.log(" API: Obteniendo mis solicitudes de acompañamiento");
  const response = await api.get("/companion-requests/my-requests");
  console.log(" API: Mis solicitudes:", response.data);
  return response.data;
};

export const listActiveCompanionRequests = async (): Promise<CompanionRequestDto[]> => {
  console.log(" API: Listando solicitudes activas de acompañamiento");
  const response = await api.get("/companion-requests/available");
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
  
  const response = await api.get(`/companion-requests/search?${params.toString()}`);
  console.log(" API: Solicitudes encontradas:", response.data);
  return response.data;
};

export const requestToJoinCompanionRequest = async (id: number, message?: string): Promise<void> => {
  await api.post(`/companion-requests/${id}/join-request`, message ?? null, {
    headers: { "Content-Type": "text/plain" },
  });
};

export const cancelJoinRequest = async (id: number): Promise<void> => {
  console.log(" API: Cancelando solicitud de acompañamiento:", id);
  await api.delete(`/companion-requests/${id}/join-request`);
  console.log(" API: Solicitud cancelada");
};

export const updateCompanionGroupId = async (companionRequestId: number, groupId: number): Promise<CompanionRequestDto> => {
  console.log("API: Vinculando grupo con companion request:", { companionRequestId, groupId });
  const response = await api.post(`/companion-requests/${companionRequestId}/link-group/${groupId}`);
  console.log("API: Grupo vinculado al companion request:", response.data);
  return response.data;
};

export const getCompanionRequestById = async (id: number): Promise<CompanionRequestDto> => {
  console.log("API: Obteniendo solicitud de acompañamiento por ID:", id);
  const response = await api.get(`/companion-requests/${id}`);
  console.log("API: Solicitud obtenida:", response.data);
  return response.data;
};

export const getCompanionRequestByCompanionGroupId = async (groupId: number): Promise<CompanionRequestDto> => {
  console.log("API: Obteniendo solicitud de acompañamiento por ID de grupo:", groupId);
  const response = await api.get(`/companion-requests/by-companion-group/${groupId}`);
  console.log("API: Solicitud obtenida:", response.data);
  return response.data;
};
