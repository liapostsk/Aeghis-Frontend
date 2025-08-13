import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeLocation } from '../../api/types';
import { getLocationFromCoordinates } from '@/api/safeLocations/googleGeocodingApi';

type MapLocationPickerProps = {
    visible: boolean;
    onClose: () => void;
    onSelectLocation: (location: SafeLocation) => void;
};

export default function MapLocationPicker({ visible, onClose, onSelectLocation }: MapLocationPickerProps) {
    const [region, setRegion] = useState<Region | null>(null);
    const [selectedCoordinates, setSelectedCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
    const [locationName, setLocationName] = useState<string>('');
    const [showNamingModal, setShowNamingModal] = useState(false);

    // Función para limpiar el estado
    const resetState = () => {
        setSelectedCoordinates(null);
        setLocationName('');
        setShowNamingModal(false);
        setRegion(null);
    };

    useEffect(() => {
        const getInitialLocation = async () => {
            try {
                if (!visible) return;

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
            } catch (error) {
                console.error("❌ Error al obtener ubicación:", error);
                Alert.alert("Error", "No se pudo obtener la ubicación actual.");
            }
        };

        if (visible) {
            getInitialLocation();
        } else {
            resetState();
        }
    }, [visible]);

    const handleMapPress = (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        console.log("📍 Ubicación seleccionada:", { latitude, longitude });
        
        // Primero establecemos las coordenadas
        setSelectedCoordinates({ latitude, longitude });
        // Limpiamos el nombre anterior
        setLocationName('');
        // Mostramos el modal de nombrado
        setShowNamingModal(true);
    };

    const handleConfirmLocation = async () => {
        if (selectedCoordinates && locationName.trim()) {
            console.log("✅ Confirmando ubicación:", selectedCoordinates, locationName);
            try {
                // Obtenemos los detalles de la ubicación
                const locationInfo = await getLocationFromCoordinates(
                    selectedCoordinates.latitude, 
                    selectedCoordinates.longitude,
                    locationName.trim()
                    // Pasamos las coordenadas del usuario, pasar por el PropTypes
                    // userLat, userLng
                    
                );
                
                if (!locationInfo) {
                    throw new Error("No se pudo obtener información de la ubicación.");
                }
                
                console.log("✅ Ubicación con geocoding:", locationInfo);
                onSelectLocation(locationInfo);
                
            } catch (error) {
                console.error("❌ Error al obtener detalles de la ubicación:", error);
                console.log("🔄 Usando fallback sin geocoding");
                
                // Fallback: crear ubicación básica sin geocoding
                const locationData: SafeLocation = {
                    name: locationName.trim(),
                    description: "Ubicación personalizada", 
                    address: `${selectedCoordinates.latitude.toFixed(6)}, ${selectedCoordinates.longitude.toFixed(6)}`,
                    type: 'custom',
                    latitude: selectedCoordinates.latitude,
                    longitude: selectedCoordinates.longitude,
                    externalId: `custom_${selectedCoordinates.latitude}_${selectedCoordinates.longitude}`,
                };
                
                console.log("✅ Ubicación fallback:", locationData);
                onSelectLocation(locationData);
            } finally {
                // Siempre limpiar estado al final
                resetState();
                onClose();
            }
        } else {
            console.warn("⚠️ No se puede confirmar: faltan coordenadas o nombre");
        }
    };

    const handleCancelNaming = () => {
        console.log("❌ Cancelando nombrado de ubicación");
        // Solo ocultamos el modal de nombrado, mantenemos el marker para que puedan seleccionar otro punto
        setShowNamingModal(false);
        setLocationName('');
        // NO limpiamos selectedCoordinates para que el marker se mantenga visible
    };

    const handleCloseModal = () => {
        console.log("❌ Cerrando modal completo");
        resetState();
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.textTitle}>Selecciona una ubicación en el mapa</Text>
                        <Pressable style={styles.closeButton} onPress={handleCloseModal}>
                            <Ionicons name="close" size={24} color="#000" />
                        </Pressable>
                    </View>
                    
                    {/* Contenido del mapa */}
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
                                    {/* Condición simplificada para el marker */}
                                    {selectedCoordinates && (
                                        <Marker
                                            coordinate={{
                                                latitude: selectedCoordinates.latitude,
                                                longitude: selectedCoordinates.longitude,
                                            }}
                                            title={locationName || 'Ubicación seleccionada'}
                                            pinColor="#7A33CC"
                                        />
                                    )}
                                </MapView>
                            </View>
                            
                            {/* Modal de nombrado */}
                            {showNamingModal && (
                                <>
                                    <View style={styles.namingModalOverlay} />
                                    <View style={styles.namingOverlayAnimated}>
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
                                                        onPress={handleCancelNaming}
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
                                </>
                            )}
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
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    namingOverlayAnimated: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    namingOverlay: {
        padding: 20,
        paddingBottom: 40,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 10,
    },
    namingContainer: {
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