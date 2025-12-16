import api from "../../client";
import { CompanionRequestDto, CreateCompanionRequestDto } from '@/api/backend/companionRequest/companionTypes';
import { JourneyDto } from "../journeys/journeyType";

export const createCompanionRequest = async (dto: CreateCompanionRequestDto): Promise<number> => {
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

export const requestToJoinCompanionRequest = async (id: number, companionMessage: string): Promise<void> => {
  console.log("🤝 API: Solicitando unirse a solicitud de acompañamiento:", id);
  console.log("📝 Mensaje del companion:", companionMessage);
  
  // TODO: Implementar endpoint en backend
  // POST /companion-request/{id}/request-join
  // Body: { companionMessage: string }
  // El companionMessage es un string formateado con campos estructurados:
  // "Motivo: ... | Experiencia: ... | Disponibilidad: ... | Flexibilidad: ... | Información adicional: ..."
  
  await api.post(`/companion-request/${id}/request-join`, { companionMessage });
  console.log("✅ API: Solicitud de unión enviada");
};

export const cancelCompanionRequest = async (id: number): Promise<void> => {
  console.log(" API: Cancelando solicitud de acompañamiento:", id);
  await api.post(`/companion-request/${id}/request-join/cancel`);
  console.log(" API: Solicitud cancelada");
};

/**
 * Endpoint for both the creator and the searcher
 */

export const updateCompanionGroupId = async (companionRequestId: number, groupId: number): Promise<CompanionRequestDto> => {
  console.log("🔄 API: Vinculando grupo con companion request:", { companionRequestId, groupId });
  const response = await api.post(`/companion-request/${companionRequestId}/link-group/${groupId}`);
  console.log("✅ API: Grupo vinculado al companion request:", response.data);
  return response.data;
};

export const getCompanionRequestById = async (id: number): Promise<CompanionRequestDto> => {
  console.log("📋 API: Obteniendo solicitud de acompañamiento por ID:", id);
  const response = await api.get(`/companion-request/${id}`);
  console.log("✅ API: Solicitud obtenida:", response.data);
  return response.data;
};

// ============================================================================
// ENDPOINTS PARA TRACKING GROUPS
// Estos endpoints permiten asociar los grupos donde cada participante comparte
// su ubicación durante el trayecto de acompañamiento
// ============================================================================

/**
 * Asocia un grupo de tracking (del creador o companion) a la solicitud
 * 
 * @param companionRequestId - ID de la companion request
 * @param trackingGroupId - ID del grupo donde se comparte ubicación
 * @param isCreatorTrackingGroup - true si es el grupo del creador, false si es del companion
 * 
 * Backend: POST /companion-request/{id}/link-tracking-group/{groupId}?isCreatorTrackingGroup=true/false
 * - Si ambos tracking groups están rellenos, cambia el estado a IN_PROGRESS
 */
export const linkTrackingGroupToCompanionRequest = async (
  companionRequestId: number, 
  trackingGroupId: number,
  isCreatorTrackingGroup: boolean
): Promise<CompanionRequestDto> => {
  console.log("🎯 API: Asociando grupo de tracking:", { companionRequestId, trackingGroupId, isCreatorTrackingGroup });
  const response = await api.post(
    `/companion-request/${companionRequestId}/link-tracking-group/${trackingGroupId}`,
    null,
    { params: { isCreatorTrackingGroup } }
  );
  console.log("✅ API: Grupo de tracking asociado:", response.data);
  return response.data;
};

/**
 * Obtiene el CompanionRequest asociado a un grupo COMPANION específico
 * Útil para obtener el ID de la request cuando solo tenemos el groupId
 * 
 * Backend: GET /companion-request/by-companion-group/{groupId}
 */
export const getCompanionRequestByCompanionGroupId = async (groupId: number): Promise<CompanionRequestDto> => {
  console.log("🔍 API: Buscando companion request por companion groupId:", groupId);
  const response = await api.get(`/companion-request/by-companion-group/${groupId}`);
  console.log("✅ API: Companion request encontrada:", response.data);
  return response.data;
};
