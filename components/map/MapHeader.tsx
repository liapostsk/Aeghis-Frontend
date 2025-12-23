import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { useUserGroups } from '@/lib/hooks/useUserGroups';
import { getCurrentJourneyForGroup } from '@/api/backend/journeys/journeyApi';
import { Group } from '@/api/backend/group/groupType';
import { JourneyDto } from '@/api/backend/journeys/journeyType';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { useTranslation } from 'react-i18next';

interface GroupWithJourney {
  group: Group;
  activeJourney: JourneyDto;
}

interface Props {
  activeGroupJourney: GroupWithJourney | null;
  onGroupJourneySelect: (groupJourney: GroupWithJourney | null) => void;
}

export default function MapHeader({ activeGroupJourney, onGroupJourneySelect }: Props) {
  const { t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [groupsWithJourneys, setGroupsWithJourneys] = useState<GroupWithJourney[]>([]);
  const [loading, setLoading] = useState(false);


  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);
  const { groups: userGroups } = useUserGroups();

  const loadGroupsWithActiveJourneys = async () => {
    if (userGroups.length === 0) return;

    try {
      setLoading(true);
      
      console.log('🔍 [MapHeader] Verificando journeys activos para', userGroups.length, 'grupos');
      
      const groupJourneyPromises = userGroups.map(async (group) => {
        try {
          const token = await getToken();
          setToken(token);

          const activeJourney = await getCurrentJourneyForGroup(group.id);
          
          console.log(`Grupo: ${group.name}, Journey:`, activeJourney?.id || 'ninguno');

          if (activeJourney && 
              (activeJourney.state === 'IN_PROGRESS' || activeJourney.state === 'PENDING')) {
            return { group, activeJourney };
          }
          return null;
        } catch (error) {
          return null;
        }
      });

      const results = await Promise.all(groupJourneyPromises);
      const validGroupJourneys = results.filter(Boolean) as GroupWithJourney[];
      
      setGroupsWithJourneys(validGroupJourneys);

      if (validGroupJourneys.length > 0 && !activeGroupJourney) {
        console.log('[MapHeader] Auto-seleccionando:', validGroupJourneys[0].activeJourney.id);
        onGroupJourneySelect(validGroupJourneys[0]);
      }
      
      if (activeGroupJourney) {
        const stillActive = validGroupJourneys.find(
          gj => gj.group.id === activeGroupJourney.group.id
        );
        if (!stillActive) {
          console.log('[MapHeader] Journey ya no activo, limpiando');
          onGroupJourneySelect(null);
        }
      }
      
    } catch (error) {
      console.error('Error loading groups:', error);
      setGroupsWithJourneys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupsWithActiveJourneys();
  }, [userGroups]);

  // Listener para detectar cambios en journeys en tiempo real
  useEffect(() => {
    if (userGroups.length === 0) return;

    const { getDatabase, ref, onValue, off } = require('firebase/database');
    const db = getDatabase();
    
    const listeners: (() => void)[] = [];

    userGroups.forEach((group) => {
      const journeysRef = ref(db, `/chats/${group.id}/journeys`);
      
      const listener = onValue(journeysRef, (snapshot: any) => {
        if (snapshot.exists()) {
          console.log(`[MapHeader] Cambio detectado en journeys de grupo ${group.name}`);
          loadGroupsWithActiveJourneys();
        }
      }, (error: any) => {
        console.error(`[MapHeader] Error en listener para grupo ${group.id}:`, error);
      });

      // Guardar la función de limpieza
      listeners.push(() => off(journeysRef));
    });

    // Cleanup: desuscribir todos los listeners
    return () => {
      console.log('🧹 [MapHeader] Limpiando listeners de Firebase');
      listeners.forEach(cleanup => cleanup());
    };
  }, [userGroups]);

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
      return { color: '#10B981', text: t('mapHeader.status.inProgress') };
    } else if (journey.state === 'PENDING') {
      return { color: '#F59E0B', text: t('mapHeader.status.pending') };
    }
    return { color: '#6B7280', text: t('mapHeader.status.unknown') };
  };

  return (
    <View style={styles.header}>

      {/* Selector de grupo con journey */}
      <Pressable 
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
              {groupsWithJourneys.length > 0 ? t('mapHeader.selectGroup') : t('mapHeader.noActiveGroups')}
            </Text>
            {groupsWithJourneys.length > 0 && (
              <Icon name="chevron-down" size={20} color="#666" />
            )}
          </>
        )}
      </Pressable>

      {/* Dropdown overlay y contenido */}
      {showDropdown && (
        <>
          <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
            <View style={styles.dropdownOverlay} />
          </TouchableWithoutFeedback>
          
          <View style={styles.dropdown}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>{t('mapHeader.activeJourneysGroups')}</Text>
              <Pressable onPress={() => setShowDropdown(false)}>
                <Icon name="close" size={24} color="#666" />
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#7A33CC" />
                <Text style={styles.loadingText}>{t('mapHeader.loadingGroups')}</Text>
              </View>
            ) : groupsWithJourneys.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="car-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>{t('mapHeader.noActiveJourneys')}</Text>
                <Text style={styles.emptyText}>
                  {t('mapHeader.noJourneysDescription')}
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.groupsList}>
                {/* Opción para limpiar selección */}
                {activeGroupJourney && (
                  <Pressable 
                    style={styles.groupOption}
                    onPress={handleClearSelection}
                  >
                    <View style={styles.groupOptionContent}>
                      <Icon name="close-circle-outline" size={24} color="#EF4444" />
                      <Text style={styles.clearText}>{t('mapHeader.clearSelection')}</Text>
                    </View>
                  </Pressable>
                )}

                {groupsWithJourneys.map((groupJourney) => {
                  const stateInfo = getJourneyStateInfo(groupJourney.activeJourney);
                  const isSelected = activeGroupJourney?.group.id === groupJourney.group.id;

                  return (
                    <Pressable
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
                              {t('mapHeader.journey')} {groupJourney.activeJourney.journeyType?.toLowerCase() || t('mapHeader.status.unknown').toLowerCase()} • {stateInfo.text}
                            </Text>
                          </View>
                        </View>

                        {isSelected && (
                          <Icon name="checkmark-circle" size={24} color="#10B981" />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <Pressable 
              style={styles.refreshButton}
              onPress={loadGroupsWithActiveJourneys}
            >
              <Icon name="refresh" size={18} color="#7A33CC" />
              <Text style={styles.refreshText}>{t('mapHeader.refresh')}</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 65,
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