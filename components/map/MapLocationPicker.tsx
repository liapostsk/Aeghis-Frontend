import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeLocation } from '../../api/types';

type MapLocationPickerProps = {
    visible: boolean;
    onClose: () => void;
    onSelectLocation: (location: SafeLocation) => void;
};

export default function MapLocationPicker({ visible, onClose, onSelectLocation }: MapLocationPickerProps) {
    // Este componente se encarga de seleccionar ubicaciones en el mapa
    //console.log("🗺️ MapLocationPicker - props recibidas:", { visible, onClose: !!onClose, onSelectLocation: !!onSelectLocation });

    const [region, setRegion] = useState<Region | null>(null);
    const [selectedCoordinates, setSelectedCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
    const [locationName, setLocationName] = useState<string>('');
    const [isRenamed, setIsRenamed] = useState(false);

    useEffect(() => {
        const getInitialLocation = async () => {
            if (!visible) return; // Solo obtener ubicación cuando el modal sea visible

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
        };

        if (visible) {
            getInitialLocation();
        } else {
            // Limpiar estado cuando el modal se cierre
            setSelectedCoordinates(null);
            setLocationName('');
            setIsRenamed(false);
            setRegion(null);
        }
    }, [visible]); // Ejecutar cuando visible cambie

    const handleMapPress = (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setSelectedCoordinates({ latitude, longitude });
        setIsRenamed(true);
    };

    const handleConfirmLocation = async () => {
        if (selectedCoordinates && locationName.trim()) {
            const locationData = {
                latitude: selectedCoordinates.latitude,
                longitude: selectedCoordinates.longitude,
                name: locationName.trim(),
                address: `${selectedCoordinates.latitude.toFixed(6)}, ${selectedCoordinates.longitude.toFixed(6)}`, // Coordenadas como dirección temporal
                type: 'custom' // Tipo para ubicaciones seleccionadas manualmente
            };
            
            console.log("✅ Confirmando ubicación:", locationData);
            onSelectLocation(locationData);
            
            // Limpiar estado y cerrar modal
            setSelectedCoordinates(null);
            setLocationName('');
            setIsRenamed(false);
            onClose();
        }
    };

    const handleCancel = () => {
        console.log("❌ Cancelando selección de ubicación");
        // Limpiar estado completo para volver al estado inicial
        setSelectedCoordinates(null);
        setLocationName('');
        setIsRenamed(false);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Header*/}
                    <View style={styles.header}>
                        <Text style={styles.textTitle}>Selecciona una ubicación en el mapa</Text>
                        <Pressable style={styles.closeButton} onPress={() => {
                            // Limpiar estado y cerrar modal
                            setSelectedCoordinates(null);
                            setLocationName('');
                            setIsRenamed(false);
                            onClose();
                        }}>
                            <Ionicons name="close" size={24} color="#000" />
                        </Pressable>
                    </View>
                    
                    {/* Mostrar loading o mapa */}
                    {!region ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.mapContainer}>
                                <MapView
                                    style={styles.map}
                                    region={region}
                                    onPress={handleMapPress}
                                    showsUserLocation
                                >
                                    {selectedCoordinates && (
                                        <Marker
                                            coordinate={selectedCoordinates}
                                            title={locationName || 'Ubicación seleccionada'}
                                            pinColor="#7A33CC"
                                        />
                                    )}
                                </MapView>
                            </View>
                            
                            {/* Modal para nombrar ubicación */}
                            <Modal 
                                visible={isRenamed} 
                                animationType="slide" 
                                transparent
                                onRequestClose={handleCancel}
                            >
                                <View style={styles.namingModalOverlay}>
                                    <KeyboardAvoidingView 
                                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                                        style={styles.namingOverlay}
                                    >
                                        <View style={styles.namingContainer}>
                                            <Text style={styles.namingTitle}>Nombra esta ubicación</Text>
                                            <TextInput
                                                style={styles.nameInput}
                                                placeholder="Ej: Mi casa, Oficina, Gimnasio..."
                                                value={locationName}
                                                onChangeText={setLocationName}
                                                autoFocus
                                                maxLength={50}
                                            />
                                            <View style={styles.namingButtons}>
                                                <Pressable 
                                                    style={styles.cancelButton} 
                                                    onPress={handleCancel}
                                                >
                                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                                </Pressable>
                                                <Pressable 
                                                    style={[styles.confirmButton, !locationName.trim() && styles.confirmButtonDisabled]} 
                                                    onPress={handleConfirmLocation}
                                                    disabled={!locationName.trim()}
                                                >
                                                    <Text style={styles.confirmButtonText}>Confirmar</Text>
                                                </Pressable>
                                            </View>
                                        </View>
                                    </KeyboardAvoidingView>
                                </View>
                            </Modal>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modal: {
        flex: 0.85,
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    header: {
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    textTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    closeButton: {
        top: 10,
        right: 10,
        padding: 10,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    mapContainer: {
        flex: 1,
        borderRadius: 10,
        overflow: 'hidden',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    namingModalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.16)',
    },
    namingOverlay: {
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    namingContainer: {
        bottom: "5%",
        justifyContent: 'center',
    },
    namingTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    nameInput: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 10,
        backgroundColor: '#fff',
        fontSize: 16,
        color: '#333',
    },
    namingButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        bottom: 10,
    },
    cancelButton: {
        width: 150,
        height: 50,
        backgroundColor: '#f0f0f0',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButton: {
        width: 150,
        height: 50,
        backgroundColor: '#7A33CC',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: '#ccc',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});