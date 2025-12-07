import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CreateJourneyButtonProps {
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
  creationStep?: string;
}

export default function CreateJourneyButton({ 
  onPress, 
  disabled, 
  loading, 
  creationStep 
}: CreateJourneyButtonProps) {
  return (
    <View style={styles.buttonContainer}>
      <Pressable
        style={[
          styles.createButton,
          disabled && styles.createButtonDisabled
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        {loading ? (
          <>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={styles.createButtonText}>
              {creationStep || 'Creando trayecto...'}
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Crear trayecto</Text>
          </>
        )}
      </Pressable>
      
      {disabled && !loading && (
        <Text style={styles.disabledHint}>
          Completa todos los campos requeridos
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    // Sombra sutil hacia arriba
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  createButton: {
    backgroundColor: '#7A33CC',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    // Sombra para el botón
    shadowColor: '#7A33CC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});