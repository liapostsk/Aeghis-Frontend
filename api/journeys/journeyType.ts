import { Participation } from "@/api/participations/participationType";
import { Group } from "../group/groupType";

export interface Journey {
    id: number;
    state: JourneyState;
    type: JourneyType;
    iniDate: string;
    endDate?: string;
    participants: Participation[];
    group: Group;
}

export interface JourneyDto {
    id?: number;
    groupId: number;
    state: JourneyState;
    type: JourneyType;
    iniDate: string;
    endDate?: string;
    participantsIds: number[];
}

export const JourneyTypes = {
    INDIVIDUAL: 'individual',
    COMMON_DESTINATION: 'common_destination',
    PERSONALIZED: 'personalized',
} as const;

export type JourneyType = typeof JourneyTypes[keyof typeof JourneyTypes];

export const JourneyStates = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
} as const;

export type JourneyState = typeof JourneyStates[keyof typeof JourneyStates];

// Mapper from JourneyDto to Journey
export const mapJourneyDtoToJourney = (dto: JourneyDto, participants: Participation[], group: Group): Journey => {
    return {
        id: dto.id!,
        state: dto.state,
        type: dto.type,
        iniDate: dto.iniDate,
        endDate: dto.endDate,
        participants,
        group,
    };
}

// Mapper from Journey to JourneyDto
export const mapJourneyToJourneyDto = (journey: Journey): JourneyDto => {
    return {
        id: journey.id,
        groupId: journey.group.id,
        state: journey.state,
        type: journey.type,
        iniDate: journey.iniDate,
        endDate: journey.endDate,
        participantsIds: journey.participants.map(p => p.id),
    };
}