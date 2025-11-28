// File: components/map/GroupMap.tsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Alert, Image } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import MapStyleButton, { MapType } from './MapStyleButton';
import { useAllParticipantsPositions } from '@/lib/hooks/usePositions';

// Recibe props o usa contexto para chatId, journeyId, journeyState, participants
// participants: [{ id, name, avatarUrl }]
export default function PeopleOnMap({ chatId, journeyId, journeyState, participants }) {

  const [region, setRegion] = useState<Region | null>(null);
  const [mapType, setMapType] = useState<MapType>('standard');

  // 1. Escuchar posiciones solo si el journey está IN_PROGRESS
  const enabled = journeyState === 'IN_PROGRESS';
  const participantUserIds = participants.map(p => p.id);
  const { positionsMap } = useAllParticipantsPositions(
    enabled ? chatId : undefined,
    enabled ? journeyId : undefined,
    enabled ? participantUserIds : [],
    1 // Solo la última posición
  );

  // 2. Centrar el mapa en la ubicación del usuario
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission denied", "Location access is required.");
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  const handleMapTypeChange = (newMapType: MapType) => {
    setMapType(newMapType);
  };

  if (!region) return null;

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        region={region}
        mapType={mapType}
        showsUserLocation
        showsCompass
        showsScale
        showsBuildings={true}
        showsIndoors={true}
        pitchEnabled={true}
        rotateEnabled={true}
        zoomEnabled={true}
        scrollEnabled={true}
      >
        {/* Renderizar marcadores de participantes */}
        {[...positionsMap.entries()].map(([userId, positions]) => {
          const pos = positions[0];
          if (!pos) return null;
          const user = participants.find(u => u.id === userId);
          return (
            <Marker
              key={userId}
              coordinate={{
                latitude: pos.latitude,
                longitude: pos.longitude,
              }}
              title={user?.name}
            >
              <View style={styles.marker}>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
                ) : null}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Botón de estilo del mapa */}
      <MapStyleButton 
        mapType={mapType} 
        onMapTypeChange={handleMapTypeChange} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  marker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
});
