// File: app/(tabs)/groups.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TrustedGroups from '../../components/groups/TrustedGroups';
import TemporalGroups from '../../components/groups/TemporalGroups';
import CompanionGroups from '../../components/groups/CompanionGroups';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GroupsScreen() {
  const [activeTab, setActiveTab] = useState<'trusted' | 'temporals' | 'companions'>('trusted');
  const [search, setSearch] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groups</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {['trusted', 'temporals', 'companions'].map((tab) => (
          <TouchableOpacity
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
          </TouchableOpacity>
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
        {activeTab === 'trusted' && <TrustedGroups />}
        {activeTab === 'temporals' && <TemporalGroups />}
        {activeTab === 'companions' && <CompanionGroups />}
      </View>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
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
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#F5C80E',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});
