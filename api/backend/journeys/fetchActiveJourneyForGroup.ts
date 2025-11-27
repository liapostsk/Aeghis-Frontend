import { getCurrentJourneyForGroup } from '@/api/backend/journeys/journeyApi';
import { JourneyDto } from '@/api/backend/journeys/journeyType';

export async function fetchActiveJourneyForGroup(groupId: number): Promise<JourneyDto | null> {
  try {
    const journey = await getCurrentJourneyForGroup(groupId);
    if (journey && (journey.state === 'IN_PROGRESS' || journey.state === 'PENDING')) {
      return journey;
    }
    return null;
  } catch (e) {
    return null;
  }
}
