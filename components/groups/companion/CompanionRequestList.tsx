import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompanionRequestDto } from '@/api/backend/types';

interface CompanionRequestListProps {
  requests: CompanionRequestDto[];
  onRequestPress?: (request: CompanionRequestDto) => void;
  onJoinRequest?: (requestId: number) => void;
}

export default function CompanionRequestList({
  requests,
  onRequestPress,
  onJoinRequest,
}: CompanionRequestListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      (req.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'CREATED': return 'Creada';
      case 'PENDING': return 'Pendiente';
      case 'MATCHED': return 'Emparejada';
      case 'IN_PROGRESS': return 'En progreso';
      case 'FINISHED': return 'Finalizada';
      case 'DECLINED': return 'Rechazada';
      case 'CANCELLED': return 'Cancelada';
      default: return state;
    }
  };

  const getStateColor = (state: string) => {
    if (state === 'CREATED' || state === 'PENDING') return '#10B981';
    if (state === 'IN_PROGRESS') return '#3B82F6';
    if (state === 'FINISHED') return '#6B7280';
    return '#EF4444';
  };

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por descripción..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Lista de solicitudes */}
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <Pressable 
            style={styles.requestCard}
            onPress={() => onRequestPress?.(item)}
          >
            <View style={styles.requestHeader}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Ionicons name="time" size={20} color="#7A33CC" />
                </View>
                <View>
                  <Text style={styles.userName}>Solicitud de acompañamiento</Text>
                  <Text style={styles.requestDate}>
                    {new Date(item.creationDate).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.routeInfo}>
              <View style={styles.routePoint}>
                <Ionicons name="location" size={16} color="#10B981" />
                <Text style={styles.routeText}>
                  Ubicación #{item.sourceId}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color="#9CA3AF" style={styles.routeArrow} />
              <View style={styles.routePoint}>
                <Ionicons name="location" size={16} color="#EF4444" />
                <Text style={styles.routeText}>
                  Ubicación #{item.destinationId}
                </Text>
              </View>
            </View>

            {item.description && (
              <Text style={styles.requestDescription} numberOfLines={2}>
                {item.description}
              </Text>
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
              
              {(item.state === 'CREATED' || item.state === 'PENDING') && onJoinRequest && (
                <Pressable 
                  style={styles.joinButton}
                  onPress={() => onJoinRequest(item.id)}
                >
                  <Text style={styles.joinButtonText}>Solicitar</Text>
                </Pressable>
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
