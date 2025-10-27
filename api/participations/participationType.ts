import { User } from "@/lib/storage/useUserStorage";
import { Journey } from "../journeys/journeyType";
import { Location } from "../locations/locationType";

export interface Participation {
    id: number;
    journey: Journey;
    user: User;
    sharedLocation: boolean;
    source: Location;
    destination: Location;
    state: ParticipationState;
    arrivalTime?: Date;
    // Valoración del usuario sobre el journey una vez completado
}

export interface ParticipationDto {
    id: number;
    journeyId: number;
    userId: number;
    sharedLocation: boolean;
    sourceId: number;
    destinationId: number;
    state: ParticipationState;
    arrivalTime?: Date;
}

export type ParticipationState = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "COMPLETED";

// Mapeo de Participation a ParticipationDto
export const mapParticipationToDto = (participation: Participation): ParticipationDto => {
    return {
        id: participation.id,
        journeyId: participation.journey.id,
        userId: participation.user.id,
        sharedLocation: participation.sharedLocation,
        sourceId: participation.source.id!,
        destinationId: participation.destination.id!,
        state: participation.state,
        arrivalTime: participation.arrivalTime,
    };
}

// Mapeo de ParticipationDto a Participation
export const mapDtoToParticipation = (dto: ParticipationDto, journey: Journey, user: User, source: Location, destination: Location): Participation => {
    return {
        id: dto.id,
        journey,
        user,
        sharedLocation: dto.sharedLocation,
        source,
        destination,
        state: dto.state,
        arrivalTime: dto.arrivalTime,
    };
}