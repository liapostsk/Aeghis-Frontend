import { Participation } from "@/api/backend/participations/participationType";
import { Group } from "../group/groupType";
import { CompanionRequest } from "../types";

export interface Journey {
    id: number;
    state: JourneyState;
    journeyType: JourneyType;
    iniDate: string;
    endDate?: string;
    participants: Participation[];
    group: Group;
    companionRequest?: CompanionRequest;
}

export interface JourneyDto {
    id?: number;
    groupId: number;
    state: JourneyState;
    journeyType: JourneyType;
    iniDate: string;
    endDate?: string;
    participantsIds: number[];
    companionRequestId?: number;
}

export const JourneyTypes = {
    INDIVIDUAL: 'INDIVIDUAL',
    COMMON_DESTINATION: 'COMMON_DESTINATION',
    PERSONALIZED: 'PERSONALIZED',
} as const;

export type JourneyType = typeof JourneyTypes[keyof typeof JourneyTypes];

export const JourneyStates = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
} as const;

export type JourneyState = typeof JourneyStates[keyof typeof JourneyStates];

// Mapper from JourneyDto to Journey
export const mapJourneyDtoToJourney = (dto: JourneyDto, participants: Participation[], group: Group, companionRequest: CompanionRequest): Journey => {
    return {
        id: dto.id!,
        state: dto.state,
        journeyType: dto.journeyType,
        iniDate: dto.iniDate,
        endDate: dto.endDate,
        participants,
        group,
        companionRequest
    };
}

// Mapper from Journey to JourneyDto
export const mapJourneyToJourneyDto = (journey: Journey): JourneyDto => {
    return {
        id: journey.id,
        groupId: journey.group.id,
        state: journey.state,
        journeyType: journey.journeyType,
        iniDate: journey.iniDate,
        endDate: journey.endDate,
        participantsIds: journey.participants.map(p => p.id),
        companionRequestId: journey.companionRequest ? journey.companionRequest.id : undefined,
    };
}