// Componentes principales para la creación de trayectos
export { default as DestinationSelector } from './DestinationSelector';
export { default as JourneyTypeSelector } from './JourneyTypeSelector';
export { default as ParticipantSelector } from './ParticipantSelector';
export { default as GroupBanner } from './GroupBanner';
export { default as JourneyNameInput } from './JourneyNameInput';
export { default as CreateJourneyButton } from './CreateJourneyButton';
export { default as JourneyCreationHeader } from './JourneyCreationHeader';
export { default as LoadingJourneyScreen } from './LoadingJourneyScreen';

// Hooks
export { useJourneyCreation } from './useJourneyCreation';
export { useJourneyForm } from './useJourneyForm';
export { useGroupData } from './useGroupData';

// Utilidades y validaciones
export { 
  validateJourneyForm, 
  generateDefaultJourneyName, 
  mapJourneyTypeToAPI 
} from './journeyUtils';

// Exportar tipos
export type { JourneyType } from './JourneyTypeSelector';
export type { JourneyFormData, ValidationResult } from './journeyUtils';