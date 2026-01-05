import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Alert, Image } from 'react-native';
import MapView, { Marker, Polyline, Region, LatLng } from 'react-native-maps';
import * as Location from 'expo-location';
import MapStyleButton, { MapType } from './MapStyleButton';
import { useAllParticipantsPositions } from '@/lib/hooks/usePositions';
import { getRouteBetweenPoints } from '@/api/backend/locations/safeLocations/googleDirectionsApi';
import { JourneyState } from '@/api/backend/journeys/journeyType';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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

  // Logs de depuración
  useEffect(() => {
    console.log('PeopleOnMap - Estado:', {
      enabled,
      journeyState,
      participantesRecibidos: participants.length,
      posicionesEnMapa: positionsMap.size
    });
    
    participants.forEach(p => {
      console.log(`Participante ${p.id}:`, {
        nombre: p.name,
        tieneAvatar: !!p.avatarUrl,
        tieneDestino: !!p.destination,
        destino: p.destination
      });
    });
    
    positionsMap.forEach((positions, userId) => {
      console.log(`Posiciones de ${userId}:`, positions.length, positions[0]);
    });
  }, [participants, positionsMap, enabled, journeyState]);

  // 2. Centrar el mapa en la ubicación del usuario
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('peopleOnMap.permissionDenied'), t('peopleOnMap.locationRequired'));
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

  // 3. Obtener y almacenar rutas para cada participante
  const [routes, setRoutes] = useState<Record<string, LatLng[]>>({}); // { [userId]: LatLng[] }

  // Obtener rutas cuando el journey está activo y hay posiciones
  useEffect(() => {
    let isMounted = true;
    async function fetchRoutes() {
      const newRoutes: Record<string, LatLng[]> = {};
      for (const [idx, participant] of participants.entries()) {
        const pos = positionsMap.get(participant.id)?.[0];
        const dest = participant.destination;
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
            console.log(`Error obteniendo ruta para participante ${participant.id}:`, e);
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
              {/* Marcador de participante en su posición actual */}
              {pos && (
                <Marker
                  coordinate={{
                    latitude: pos.latitude,
                    longitude: pos.longitude,
                  }}
                  title={participant?.name || t('peopleOnMap.participant')}
                >
                  {participant?.avatarUrl ? (
                    <View style={[styles.marker, { borderColor: color }]}>
                      <Image source={{ uri: participant.avatarUrl }} style={styles.avatar} />
                    </View>
                  ) : (
                    <View style={[styles.defaultMarker, { backgroundColor: color }]} />
                  )}
                </Marker>
              )}
              {/* Marcador de destino */}
              {dest && dest.latitude && dest.longitude && (
                <Marker
                  coordinate={{
                    latitude: dest.latitude,
                    longitude: dest.longitude,
                  }}
                  title={`${t('peopleOnMap.destination')} - ${participant?.name || t('peopleOnMap.participant')}`}
                >
                  <View style={[styles.destinationPin, { backgroundColor: color }]} />
                </Marker>
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
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#f0f0f0',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  defaultMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#fff',
  },
  destinationPin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#fff',
  },
});
