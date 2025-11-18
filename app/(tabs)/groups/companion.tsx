import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/lib/storage/useUserStorage';
import ProfileVerificationScreen from '@/components/profile/ProfileVerificationScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VERIFICATION_SKIPPED_KEY = 'companion_verification_skipped';

// Mock data para las solicitudes
const mockCompanionRequests = [
  {
    id: '1',
    userId: 5,
    userName: 'Carlos Rivera',
    userImage: null,
    origin: 'Plaza Catalunya',
    destination: 'Aeropuerto El Prat',
    date: '2025-11-20',
    time: '18:30',
    seats: 2,
    description: 'Viaje al aeropuerto, puedo llevar 2 personas más',
  },
  {
    id: '2',
    userId: 8,
    userName: 'María Vidal',
    userImage: null,
    origin: 'Diagonal',
    destination: 'Parc de la Ciutadella',
    date: '2025-11-19',
    time: '07:00',
    seats: 3,
    description: 'Paseo matutino, buscamos compañía para caminar',
  },
];

export default function CompanionsGroups() {
  const { user } = useUserStore();
  const [showVerification, setShowVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'create' | 'search'>('search');
  
  // Estados del formulario de creación
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState('1');
  const [description, setDescription] = useState('');
  
  // Estados de búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState(mockCompanionRequests);

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const isVerified = user?.verify || false;
      const hasSkipped = await AsyncStorage.getItem(VERIFICATION_SKIPPED_KEY);
      setShowVerification(!isVerified && !hasSkipped);
    } catch (error) {
      console.error('Error checking verification status:', error);
      setShowVerification(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationComplete = () => {
    setShowVerification(false);
  };

  const handleSkipVerification = async () => {
    try {
      await AsyncStorage.setItem(VERIFICATION_SKIPPED_KEY, 'true');
      setShowVerification(false);
    } catch (error) {
      console.error('Error saving skip status:', error);
    }
  };

  const handleCreateRequest = () => {
    if (!origin || !destination || !date || !time) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    const newRequest = {
      id: Date.now().toString(),
      userId: user?.id || 0,
      userName: user?.name || 'Usuario',
      userImage: user?.image || null,
      origin,
      destination,
      date,
      time,
      seats: parseInt(seats),
      description,
    };

    setRequests([newRequest, ...requests]);
    
    // Limpiar formulario
    setOrigin('');
    setDestination('');
    setDate('');
    setTime('');
    setSeats('1');
    setDescription('');
    
    Alert.alert('Éxito', 'Solicitud de acompañamiento creada');
    setActiveTab('search');
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.userName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (showVerification) {
    return (
      <ProfileVerificationScreen
        onVerificationComplete={handleVerificationComplete}
        onSkip={handleSkipVerification}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'search' && styles.tabActive]}
          onPress={() => setActiveTab('search')}
        >
          <Ionicons 
            name="search" 
            size={20} 
            color={activeTab === 'search' ? '#7A33CC' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>
            Buscar
          </Text>
        </Pressable>
        
        <Pressable
          style={[styles.tab, activeTab === 'create' && styles.tabActive]}
          onPress={() => setActiveTab('create')}
        >
          <Ionicons 
            name="add-circle" 
            size={20} 
            color={activeTab === 'create' ? '#7A33CC' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
            Crear solicitud
          </Text>
        </Pressable>
      </View>

      {/* Contenido según el tab activo */}
      {activeTab === 'create' ? (
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.formTitle}>Nueva solicitud de acompañamiento</Text>
          
          {/* Origen */}
          <Text style={styles.label}>Origen *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Plaza Catalunya, Barcelona"
            value={origin}
            onChangeText={setOrigin}
          />

          {/* Destino */}
          <Text style={styles.label}>Destino *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Aeropuerto El Prat"
            value={destination}
            onChangeText={setDestination}
          />

          {/* Fecha y Hora */}
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Fecha *</Text>
              <TextInput
                style={styles.input}
                placeholder="DD/MM/YYYY"
                value={date}
                onChangeText={setDate}
              />
            </View>
            
            <View style={styles.halfInput}>
              <Text style={styles.label}>Hora *</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                value={time}
                onChangeText={setTime}
              />
            </View>
          </View>

          {/* Plazas disponibles */}
          <Text style={styles.label}>Plazas disponibles</Text>
          <TextInput
            style={styles.input}
            placeholder="1"
            keyboardType="numeric"
            value={seats}
            onChangeText={setSeats}
          />

          {/* Descripción */}
          <Text style={styles.label}>Descripción (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Añade detalles sobre el trayecto..."
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          {/* Botón crear */}
          <Pressable style={styles.createButton} onPress={handleCreateRequest}>
            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
            <Text style={styles.createButtonText}>Crear solicitud</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <View style={styles.searchContainer}>
          {/* Barra de búsqueda */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por origen, destino o usuario..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Lista de solicitudes */}
          <FlatList
            data={filteredRequests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={20} color="#7A33CC" />
                    </View>
                    <View>
                      <Text style={styles.userName}>{item.userName}</Text>
                      <Text style={styles.requestDate}>
                        {item.date} · {item.time}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.routeInfo}>
                  <View style={styles.routePoint}>
                    <Ionicons name="location" size={16} color="#10B981" />
                    <Text style={styles.routeText}>{item.origin}</Text>
                  </View>
                  
                  <Ionicons name="arrow-forward" size={16} color="#9CA3AF" style={styles.routeArrow} />
                  
                  <View style={styles.routePoint}>
                    <Ionicons name="location" size={16} color="#EF4444" />
                    <Text style={styles.routeText}>{item.destination}</Text>
                  </View>
                </View>

                {item.description && (
                  <Text style={styles.requestDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}

                <View style={styles.requestFooter}>
                  <View style={styles.seatsInfo}>
                    <Ionicons name="people" size={16} color="#6B7280" />
                    <Text style={styles.seatsText}>{item.seats} plazas disponibles</Text>
                  </View>
                  
                  <Pressable style={styles.joinButton}>
                    <Text style={styles.joinButtonText}>Solicitar</Text>
                  </Pressable>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>
                  No se encontraron solicitudes
                </Text>
                <Text style={styles.emptySubtext}>
                  Intenta ajustar los filtros o crea una nueva solicitud
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#7A33CC',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#7A33CC',
  },
  
  // Formulario de creación
  formContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  createButton: {
    backgroundColor: '#7A33CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    marginVertical: 24,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Búsqueda
  searchContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  
  // Tarjetas de solicitudes
  requestCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  requestDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  routePoint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  routeArrow: {
    marginHorizontal: 4,
  },
  requestDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  seatsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seatsText: {
    fontSize: 13,
    color: '#6B7280',
  },
  joinButton: {
    backgroundColor: '#7A33CC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  joinButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  
  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
});
