import { JourneyType } from './JourneyTypeSelector';
import { SafeLocation } from '@/api/locations/locationType';

export interface JourneyFormData {
  journeyType: JourneyType | null;
  journeyName: string;
  selectedParticipants: number[];
  selectedDestination: SafeLocation | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: keyof JourneyFormData;
    message: string;
  }>;
}

/**
 * Valida los datos del formulario de creación de trayecto
 */
export function validateJourneyForm(formData: JourneyFormData): ValidationResult {
  const errors: ValidationResult['errors'] = [];

  // Validar tipo de trayecto
  if (!formData.journeyType) {
    errors.push({
      field: 'journeyType',
      message: 'Selecciona un tipo de trayecto'
    });
  }

  // Validar nombre del trayecto
  if (!formData.journeyName?.trim()) {
    errors.push({
      field: 'journeyName',
      message: 'Ingresa un nombre para el trayecto'
    });
  } else if (formData.journeyName.trim().length < 3) {
    errors.push({
      field: 'journeyName',
      message: 'El nombre debe tener al menos 3 caracteres'
    });
  }

  // Validar participantes
  if (formData.selectedParticipants.length === 0) {
    errors.push({
      field: 'selectedParticipants',
      message: 'Debe haber al menos un participante'
    });
  }

  // Validar destino para trayectos grupales
  if (formData.journeyType !== 'individual' && !formData.selectedDestination) {
    errors.push({
      field: 'selectedDestination',
      message: 'Selecciona un destino para el trayecto grupal'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Genera un nombre de trayecto por defecto basado en la fecha/hora actual
 */
export function generateDefaultJourneyName(): string {
  const now = new Date();
  const date = now.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: '2-digit' 
  });
  const time = now.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return `Trayecto ${date} ${time}`;
}

/**
 * Convierte el tipo de trayecto de la interfaz a los tipos de la API
 */
export function mapJourneyTypeToAPI(journeyType: JourneyType) {
  const mappings = {
    'individual': 'INDIVIDUAL',
    'common_destination': 'COMMON_DESTINATION', 
    'personalized': 'PERSONALIZED'
  } as const;

  return mappings[journeyType];
}