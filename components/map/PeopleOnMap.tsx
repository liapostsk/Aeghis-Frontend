// File: components/map/GroupMap.tsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Alert, Image } from 'react-native';
import MapView, { Marker, Polyline, Region, LatLng } from 'react-native-maps';
import * as Location from 'expo-location';
import MapStyleButton, { MapType } from './MapStyleButton';
import { useAllParticipantsPositions } from '@/lib/hooks/usePositions';
import { getRouteBetweenPoints } from '@/api/backend/locations/safeLocations/googleDirectionsApi';
import { JourneyState } from '@/api/backend/journeys/journeyType';

interface Participant {
  id: string;
  name?: string;
  avatarUrl?: string;
  destination?: {
    latitude: number;
    longitude: number;
  };
}

interface PeopleOnMapProps {
  chatId?: string;
  journeyId?: string;
  journeyState?: JourneyState;
  participants: Participant[];
}

const COLORS = ["#7A33CC", "#FF5733", "#33C1FF", "#4CAF50", "#FFC300", "#FF33A8", "#33FFB5", "#FF8C33"];

export default function PeopleOnMap({ chatId, journeyId, journeyState, participants }: PeopleOnMapProps) {

  const [region, setRegion] = useState<Region | null>(null);
  const [mapType, setMapType] = useState<MapType>('standard');

  // 1. Escuchar posiciones solo si el journey está IN_PROGRESS
  const enabled = journeyState === 'IN_PROGRESS';
  const participantUserIds = participants.map(p => p.id);
  const { positionsMap } = useAllParticipantsPositions(
    enabled && chatId ? chatId : '',
    enabled && journeyId ? journeyId : '',
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


  // Estado para guardar las rutas de cada participante
  const [routes, setRoutes] = useState<Record<string, LatLng[]>>({}); // { [userId]: LatLng[] }

  // Obtener rutas cuando el journey está activo y hay posiciones
  useEffect(() => {
    let isMounted = true;
    async function fetchRoutes() {
      const newRoutes: Record<string, LatLng[]> = {};
      for (const [idx, participant] of participants.entries()) {
        const pos = positionsMap.get(participant.id)?.[0];
        const dest = participant.destination; // { latitude, longitude }
        if (pos && dest && dest.latitude && dest.longitude) {
          try {
            const route = await getRouteBetweenPoints(
              pos.latitude,
              pos.longitude,
              dest.latitude,
              dest.longitude
            );
            if (route && route.coordinates) {
              newRoutes[participant.id] = route.coordinates;
            }
          } catch (e) {
            // Puedes loguear el error si quieres
            console.log(`❌ Error obteniendo ruta para participante ${participant.id}:`, e);
          }
        }
      }
      if (isMounted) setRoutes(newRoutes);
    }
    if (enabled && participants.length > 0) {
      fetchRoutes();
    } else {
      setRoutes({});
    }
    return () => { isMounted = false; };
  }, [enabled, participants, positionsMap]);

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
        {/* Renderizar rutas y marcadores de participantes */}
        {participants.map((participant, idx) => {
          const pos = positionsMap.get(participant.id)?.[0];
          const dest = participant.destination;
          const color = COLORS[idx % COLORS.length];
          return (
            <React.Fragment key={participant.id}>
              {/* Ruta */}
              {routes[participant.id] && Array.isArray(routes[participant.id]) && routes[participant.id].length > 1 && (
                <Polyline
                  coordinates={routes[participant.id]}
                  strokeColor={color}
                  strokeWidth={4}
                />
              )}
              {/* Marcador de participante */}
              {pos && (
                <Marker
                  coordinate={{
                    latitude: pos.latitude,
                    longitude: pos.longitude,
                  }}
                  title={participant?.name}
                >
                  <View style={styles.marker}>
                    {participant?.avatarUrl ? (
                      <Image source={{ uri: participant.avatarUrl }} style={styles.avatar} />
                    ) : null}
                  </View>
                </Marker>
              )}
              {/* Marcador de destino */}
              {dest && dest.latitude && dest.longitude && (
                <Marker
                  coordinate={{
                    latitude: dest.latitude,
                    longitude: dest.longitude,
                  }}
                  pinColor={color}
                  title="Destino"
                />
              )}
            </React.Fragment>
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
