import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompanionRequestDto } from '@/api/backend/companionRequest/companionTypes';

interface CompanionRequestListProps {
  requests: CompanionRequestDto[];
  onRequestPress?: (request: CompanionRequestDto) => void;
  onJoinRequest?: (request: CompanionRequestDto) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  currentUserId?: number;
  onManageRequest?: (request: CompanionRequestDto) => void;
  onDeleteRequest?: (requestId: number) => void;
}

export default function CompanionRequestList({
  requests,
  onRequestPress,
  onJoinRequest,
  onRefresh,
  refreshing = false,
  currentUserId,
  onManageRequest,
  onDeleteRequest,
}: CompanionRequestListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      (req.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.source?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.source?.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.destination?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.destination?.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.creator?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'CREATED': return 'Creada';
      case 'PENDING': return 'Pendiente';
      case 'MATCHED': return 'Emparejada';
      case 'IN_PROGRESS': return 'En progreso';
      case 'FINISHED': return 'Finalizada';
      case 'EXPIRED': return 'Expirada';
      case 'CANCELLED': return 'Cancelada';
      default: return state;
    }
  };

  const getStateColor = (state: string) => {
    if (state === 'CREATED' || state === 'PENDING') return '#10B981';
    if (state === 'IN_PROGRESS') return '#3B82F6';
    if (state === 'FINISHED') return '#6B7280';
    if (state === 'EXPIRED') return '#9CA3AF';
    return '#EF4444';
  };

  const getLocationDisplay = (location: any) => {
    if (!location) return 'Ubicación no disponible';
    
    // Priorizar name si existe (ahora viene de la BD)
    if (location.name) {
      return location.name;
    }
    
    // Fallback a address (para SafeLocations)
    if (location.address) {
      return location.address;
    }
    
    // Último fallback: coordenadas
    if (location.latitude && location.longitude) {
      return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
    }
    
    return 'Ubicación sin nombre';
  };

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por descripción, ubicación o usuario..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Lista de solicitudes */}
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        refreshing={refreshing}
        contentContainerStyle={{ paddingBottom: 40 }}
        onRefresh={onRefresh}
        renderItem={({ item }) => (
          <Pressable 
            style={styles.requestCard}
            onPress={() => onRequestPress?.(item)}
          >
            <View style={styles.requestHeader}>
              <View style={styles.userInfo}>
                {item.creator?.image ? (
                  <Image 
                    source={{ uri: item.creator.image }} 
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={20} color="#7A33CC" />
                  </View>
                )}
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>
                    {item.creator?.name || `Usuario #${item.creator?.id || 'Desconocido'}`}
                  </Text>
                  {item.aproxHour && (
                    <View style={styles.timeInfo}>
                      <Ionicons name="time-outline" size={12} color="#6B7280" />
                      <Text style={styles.requestDate}>
                        {new Date(item.aproxHour).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {item.description && (
              <Text style={styles.requestDescription} numberOfLines={2}>
                📝 {item.description}
              </Text>
            )}

            {(item.source || item.destination) && (
              <View style={styles.routeInfo}>
                {item.source && (
                  <View style={styles.routePoint}>
                    <Ionicons name="location" size={16} color="#10B981" />
                    <Text style={styles.routeText} numberOfLines={2}>
                      {getLocationDisplay(item.source)}
                    </Text>
                  </View>
                )}
                {item.source && item.destination && (
                  <Ionicons name="arrow-forward" size={16} color="#9CA3AF" style={styles.routeArrow} />
                )}
                {item.destination && (
                  <View style={styles.routePoint}>
                    <Ionicons name="location" size={16} color="#EF4444" />
                    <Text style={styles.routeText} numberOfLines={2}>
                      {getLocationDisplay(item.destination)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.requestFooter}>
              <View style={styles.stateInfo}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={getStateColor(item.state)} 
                />
                <Text style={styles.stateText}>
                  {getStateLabel(item.state)}
                </Text>
              </View>
              
              {/* Botones según si es el creador o no */}
              {currentUserId && item.creator?.id === currentUserId ? (
                <View style={styles.ownerActions}>
                  {onManageRequest && (
                    <Pressable 
                      style={styles.manageButton}
                      onPress={() => onManageRequest(item)}
                    >
                      <Ionicons name="settings-outline" size={16} color="#7A33CC" />
                      <Text style={styles.manageButtonText}>Gestionar</Text>
                    </Pressable>
                  )}
                  {onDeleteRequest && (
                    <Pressable 
                      style={styles.deleteButton}
                      onPress={() => onDeleteRequest(item.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </Pressable>
                  )}
                </View>
              ) : (
                (item.state === 'CREATED' || item.state === 'PENDING') && onJoinRequest && (
                  <Pressable 
                    style={styles.joinButton}
                    onPress={() => onJoinRequest(item)}
                  >
                    <Text style={styles.joinButtonText}>Solicitar</Text>
                  </Pressable>
                )
              )}
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
  );
}

const styles = StyleSheet.create({
  container: {
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
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userDetails: {
    flex: 1,
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
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  stateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stateText: {
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
  ownerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#7A33CC',
  },
  manageButtonText: {
    color: '#7A33CC',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
