import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

type MapType = 'standard' | 'satellite' | 'hybrid' | 'terrain';

interface MapStyleButtonProps {
  mapType: MapType;
  onMapTypeChange: (type: MapType) => void;
}

export default function MapStyleButton({ mapType, onMapTypeChange }: MapStyleButtonProps) {
  const { t } = useTranslation();
  const [showControls, setShowControls] = useState(false);

  const mapTypes: { type: MapType; label: string; icon: string }[] = [
    { type: 'standard', label: t('mapStyleButton.types.standard'), icon: 'map-outline' },
    { type: 'hybrid', label: t('mapStyleButton.types.hybrid'), icon: 'layers-outline' },
  ];

  const handleMapTypeSelect = (type: MapType) => {
    onMapTypeChange(type);
    setShowControls(false);
  };

  return (
    <View style={styles.container}>
      {/* Botón para mostrar/ocultar controles */}
      <Pressable 
        style={styles.controlsToggle}
        onPress={() => setShowControls(!showControls)}
      >
        <Ionicons 
          name={showControls ? "close" : "layers"} 
          size={24} 
          color="#FFFFFF" 
        />
      </Pressable>

      {/* Panel de controles */}
      {showControls && (
        <View style={styles.controlsPanel}>
          <View style={styles.controlSection}>
            <Text style={styles.controlTitle}>{t('mapStyleButton.mapType')}</Text>
            <View style={styles.mapTypeButtons}>
              {mapTypes.map((type) => (
                <Pressable
                  key={type.type}
                  style={[
                    styles.mapTypeButton,
                    mapType === type.type && styles.mapTypeButtonActive
                  ]}
                  onPress={() => handleMapTypeSelect(type.type)}
                >
                  <Ionicons 
                    name={type.icon as any} 
                    size={20} 
                    color={mapType === type.type ? '#fff' : '#7A33CC'} 
                  />
                  <Text style={[
                    styles.mapTypeButtonText,
                    mapType === type.type && styles.mapTypeButtonTextActive
                  ]}>
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 17,
    right: 20
  },
  controlsToggle: {
    backgroundColor: '#6200ee',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  controlsPanel: {
    position: 'absolute',
    top: 60,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 200,
  },
  controlSection: {
    marginBottom: 5,
  },
  controlTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  mapTypeButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  mapTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7A33CC',
    backgroundColor: 'white',
  },
  mapTypeButtonActive: {
    backgroundColor: '#7A33CC',
  },
  mapTypeButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#7A33CC',
    fontWeight: '500',
  },
  mapTypeButtonTextActive: {
    color: 'white',
  },
});

export type { MapType };
