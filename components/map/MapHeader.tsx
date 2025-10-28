// File: components/map/MapHeader.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { getUserGroups } from '@/api/group/groupApi';
import { getCurrentJourneyForGroup } from '@/api/journeys/journeyApi';
import { Group } from '@/api/group/groupType';
import { JourneyDto } from '@/api/journeys/journeyType';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';

interface GroupWithJourney {
  group: Group;
  activeJourney: JourneyDto;
}

interface Props {
  activeGroupJourney: GroupWithJourney | null;
  onGroupJourneySelect: (groupJourney: GroupWithJourney | null) => void;
}

export default function MapHeader({ activeGroupJourney, onGroupJourneySelect }: Props) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [groupsWithJourneys, setGroupsWithJourneys] = useState<GroupWithJourney[]>([]);
  const [loading, setLoading] = useState(false);

  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  useEffect(() => {
    loadGroupsWithActiveJourneys();
  }, []);

  const loadGroupsWithActiveJourneys = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setToken(token);
      // 1. Obtener todos los grupos del usuario
      const userGroups = await getUserGroups();

      console.log('Grupos del usuario:', userGroups);
      
      // 2. Para cada grupo, verificar si tiene journey activo
      const groupJourneyPromises = userGroups.map(async (group) => {
        try {
          const token = await getToken();
          setToken(token);

          const activeJourney = await getCurrentJourneyForGroup(group.id);
          
          console.log(`Grupo: ${group.name}, Journey activo:`, activeJourney);

          // Solo incluir si tiene journey IN_PROGRESS o PENDING
          if (activeJourney && 
              (activeJourney.state === 'IN_PROGRESS' || activeJourney.state === 'PENDING')) {
            return { group, activeJourney };
          }
          return null;
        } catch (error) {
          return null; // No tiene journey activo
        }
      });

      const results = await Promise.all(groupJourneyPromises);
      const validGroupJourneys = results.filter(Boolean) as GroupWithJourney[];
      
      setGroupsWithJourneys(validGroupJourneys);

      // Si hay grupos con journeys y no hay ninguno seleccionado, seleccionar el primero
      if (validGroupJourneys.length > 0 && !activeGroupJourney) {
        onGroupJourneySelect(validGroupJourneys[0]);
      }
      
    } catch (error) {
      console.error('Error loading groups with journeys:', error);
      setGroupsWithJourneys([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSelect = (groupJourney: GroupWithJourney) => {
    onGroupJourneySelect(groupJourney);
    setShowDropdown(false);
  };

  const handleClearSelection = () => {
    onGroupJourneySelect(null);
    setShowDropdown(false);
  };

  const getJourneyStateInfo = (journey: JourneyDto) => {
    if (journey.state === 'IN_PROGRESS') {
      return { color: '#10B981', text: 'En progreso' };
    } else if (journey.state === 'PENDING') {
      return { color: '#F59E0B', text: 'Pendiente' };
    }
    return { color: '#6B7280', text: 'Desconocido' };
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.icon}>
        <Icon name="settings-outline" size={24} color="#000" />
      </TouchableOpacity>

      {/* Selector de grupo con journey */}
      <TouchableOpacity 
        style={[
          styles.groupSelector,
          activeGroupJourney && styles.groupSelectorActive
        ]} 
        onPress={() => {
          if (groupsWithJourneys.length > 0) {
            setShowDropdown(true);
          }
        }}
      >
        {activeGroupJourney ? (
          <>
            <View style={styles.groupInfo}>
              <Text style={styles.groupText}>{activeGroupJourney.group.name}</Text>
              <Text style={[
                styles.journeyStatus, 
                { color: getJourneyStateInfo(activeGroupJourney.activeJourney).color }
              ]}>
                {getJourneyStateInfo(activeGroupJourney.activeJourney).text}
              </Text>
            </View>
            <Icon name="chevron-down" size={20} color="#000" />
          </>
        ) : (
          <>
            <Text style={styles.noGroupText}>
              {groupsWithJourneys.length > 0 ? 'Seleccionar grupo' : 'No hay grupos activos'}
            </Text>
            {groupsWithJourneys.length > 0 && (
              <Icon name="chevron-down" size={20} color="#666" />
            )}
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.icon}>
        <Icon name="notifications-outline" size={24} color="#000" />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {groupsWithJourneys.length}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Dropdown overlay y contenido */}
      {showDropdown && (
        <>
          <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
            <View style={styles.dropdownOverlay} />
          </TouchableWithoutFeedback>
          
          <View style={styles.dropdown}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Grupos con trayectos activos</Text>
              <TouchableOpacity onPress={() => setShowDropdown(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#7A33CC" />
                <Text style={styles.loadingText}>Cargando grupos...</Text>
              </View>
            ) : groupsWithJourneys.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="car-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>Sin trayectos activos</Text>
                <Text style={styles.emptyText}>
                  No hay grupos con trayectos en progreso o pendientes
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.groupsList}>
                {/* Opción para limpiar selección */}
                {activeGroupJourney && (
                  <TouchableOpacity 
                    style={styles.groupOption}
                    onPress={handleClearSelection}
                  >
                    <View style={styles.groupOptionContent}>
                      <Icon name="close-circle-outline" size={24} color="#EF4444" />
                      <Text style={styles.clearText}>Limpiar selección</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {groupsWithJourneys.map((groupJourney) => {
                  const stateInfo = getJourneyStateInfo(groupJourney.activeJourney);
                  const isSelected = activeGroupJourney?.group.id === groupJourney.group.id;

                  return (
                    <TouchableOpacity
                      key={groupJourney.group.id}
                      style={[
                        styles.groupOption,
                        isSelected && styles.groupOptionSelected
                      ]}
                      onPress={() => handleGroupSelect(groupJourney)}
                    >
                      <View style={styles.groupOptionContent}>
                        <View style={styles.groupIconContainer}>
                          <Icon name="people" size={20} color="#7A33CC" />
                        </View>
                        
                        <View style={styles.groupDetails}>
                          <Text style={styles.groupName}>
                            {groupJourney.group.name}
                          </Text>
                          <View style={styles.journeyInfo}>
                            <View style={[styles.statusDot, { backgroundColor: stateInfo.color }]} />
                            <Text style={styles.journeyTypeText}>
                              Trayecto {groupJourney.activeJourney.journeyType?.toLowerCase() || 'desconocido'} • {stateInfo.text}
                            </Text>
                          </View>
                        </View>

                        {isSelected && (
                          <Icon name="checkmark-circle" size={24} color="#10B981" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={loadGroupsWithActiveJourneys}
            >
              <Icon name="refresh" size={18} color="#7A33CC" />
              <Text style={styles.refreshText}>Actualizar</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    position: 'relative',
    zIndex: 1,
  },
  
  icon: {
    padding: 8,
    position: 'relative',
  },
  
  groupSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 140,
    maxWidth: 200,
  },
  
  groupSelectorActive: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  
  groupInfo: {
    flex: 1,
    marginRight: 8,
  },
  
  groupText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#1F2937',
  },
  
  journeyStatus: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  
  noGroupText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    textAlign: 'center',
  },
  
  badge: {
    position: 'absolute',
    right: 2,
    top: 2,
    backgroundColor: '#7A33CC',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Dropdown styles
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  
  dropdown: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 1000,
  },
  
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  groupsList: {
    maxHeight: 300,
  },
  
  groupOption: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  
  groupOptionSelected: {
    backgroundColor: '#F0FDF4',
  },
  
  groupOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  
  groupIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  groupDetails: {
    flex: 1,
  },
  
  groupName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  
  journeyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  
  journeyTypeText: {
    fontSize: 13,
    color: '#6B7280',
  },
  
  clearText: {
    fontSize: 15,
    color: '#EF4444',
    fontWeight: '500',
  },
  
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  
  refreshText: {
    fontSize: 14,
    color: '#7A33CC',
    fontWeight: '500',
  },
});