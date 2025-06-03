// File: components/map/GroupMap.tsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Alert, Image } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';

const mockMembers = [
  {
    id: 1,
    name: 'Alex',
    latitude: 41.387,
    longitude: 2.1683,
    avatar: require('../../assets/images/aegis.png'), // Asegúrate que exista
  },
  {
    id: 2,
    name: 'Maria',
    latitude: 41.3825,
    longitude: 2.1765,
    avatar: require('../../assets/images/aegis.png'), // Asegúrate que exista
  },
];

export default function GroupMap() {
  const [region, setRegion] = useState<Region | null>(null);

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

  if (!region) return null;

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region} showsUserLocation>
        {mockMembers.map(member => (
          <Marker
            key={member.id}
            coordinate={{
              latitude: member.latitude,
              longitude: member.longitude,
            }}
            title={member.name}
          >
            <View style={styles.marker}>
              <Image source={member.avatar} style={styles.avatar} />
            </View>
          </Marker>
        ))}
      </MapView>
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
