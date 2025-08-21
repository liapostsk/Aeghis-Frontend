// File: app/(tabs)/groups.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TrustedGroups from '@/components/groups/TrustedGroups';
import TemporalGroups from '@/components/groups/TemporalGroups';
import CompanionGroups from '@/components/groups/CompanionGroups';
import { SafeAreaView } from 'react-native-safe-area-context';
import GroupActionModal from '@/components/groups/GroupActionModal';
import CreateGroupModal from '@/components/groups/CreateGroupModal';
import JoinGroupModal from '@/components/groups/JoinGroupModal';
import { getUserGroups } from '@/api/group/groupApi';
import { Group } from '@/api/types';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';

export default function GroupsScreen() {
  const [activeTab, setActiveTab] = useState<'confianza' | 'temporals' | 'companions'>('confianza');
  const [search, setSearch] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const [showActionModal, setShowActionModal] = useState(false);
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  const [cache, setCache] = useState<{[k in typeof activeTab]?: Group[]}>({});

  const { getToken } = useAuth();
  const setToken = useTokenStore((state) => state.setToken);

  const typeMap: Record<typeof activeTab, string> = {
    confianza: 'CONFIANZA',
    temporals: 'TEMPORAL',
    companions: 'ACOMPANAMIENTO',
  };
    
  // al cambiar de tab, muestra cache inmediata y luego refresca:
  useEffect(() => {
    if (cache[activeTab]) setGroups(cache[activeTab]!);
    loadGroups();
  }, [activeTab]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setToken(token);
      
      const userGroups = await getUserGroups(typeMap[activeTab]);
      setGroups(userGroups);
      setCache(prev => ({ ...prev, [activeTab]: userGroups }));
      console.log('✅ Grupos cargados:', userGroups);
    } catch (error) {
      console.error('❌ Error cargando grupos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = () => {
    setShowActionModal(false);
    setIsCreatingGroup(true);
  };

  const handleJoinGroup = () => {
    setShowActionModal(false);
    setIsJoiningGroup(true);
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {['confianza', 'temporals', 'companions'].map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab as any)}
            style={[
              styles.tabButton,
              activeTab === tab && styles.tabButtonActive,
            ]}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.tabTextActive
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#7A33CC" />
        <TextInput
          placeholder="Search"
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Groups List */}
      <View style={styles.groupList}>
        {activeTab === 'confianza'   && <TrustedGroups groups={groups} loading={loading} onRefresh={loadGroups} />}
        {activeTab === 'temporals'   && <TemporalGroups groups={groups} loading={loading} onRefresh={loadGroups} />}
        {activeTab === 'companions'  && <CompanionGroups/>}
      </View>

      {/* Floating Add Button */}
      <Pressable style={styles.fab} onPress={() => setShowActionModal(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      {/* Group Action Modal - Selección inicial */}
      <GroupActionModal
        visible={showActionModal}
        onClose={() => setShowActionModal(false)}
        onCreateGroup={handleCreateGroup}
        onJoinGroup={handleJoinGroup}
      />
      
      {/* Create Group Modal */}
      {isCreatingGroup && (
        <CreateGroupModal
          visible={isCreatingGroup}
          onClose={() => setIsCreatingGroup(false)}
          type={activeTab === 'confianza' ? 'confianza' : activeTab === 'temporals' ? 'temporal' : 'companion'}
        />
      )}

      {/* Join Group Modal */}
      <JoinGroupModal
        visible={isJoiningGroup}
        onClose={() => setIsJoiningGroup(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#7A33CC',
    padding: 16,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 25,
    fontWeight: 'bold',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#EEE6F7',
  },
  tabButton: {
    paddingVertical: 12,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#7A33CC',
  },
  tabText: {
    color: '#888',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#7A33CC',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1EAFD',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 18,
    color: '#333',
  },
  groupList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  fab: {
    backgroundColor: '#F5C80E',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: '80%',
    marginBottom: '20%',
  },
});