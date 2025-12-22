import React, { createContext, useContext, useMemo, useState } from 'react';
import { Stack, Slot, Link, usePathname, Href } from 'expo-router';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

type context = {
  search: String;
  setSearch: (search: string) => void;
};

const SearchContext = createContext<context | null>(null);
export const useGroupSeach = () => useContext(SearchContext)!;

export default function GroupsLayout() {
  const { t } = useTranslation();

  const tabs: Array<{id: string; label: string; href: Href; }> = [
    { id: 'confianza', label: t('groups.layout.confianza'), href: '/(tabs)/groups' },
    { id: 'temporal', label: t('groups.layout.temporal'), href: '/(tabs)/groups/temporal' },
    { id: 'companion', label: t('groups.layout.companion'), href: '/(tabs)/groups/companion' },
  ];

  const [search, setSearch] = useState('');
  const pathname = usePathname();
  const active = tabs.find(tab => pathname.endsWith('/' + tab.id))?.id ?? 'confianza';

  const context = useMemo(() => ({ search, setSearch }), [search]);

  return (
    <SearchContext.Provider value={context}>
      <SafeAreaView style={styles.container}>

        {/* Barra de navegación personalizada */}
        <View style={styles.tabRow}>
          {tabs.map( tab => (
            <Link
              key={tab.id}
              href = {tab.href} asChild>
              <Pressable style={[styles.tabButton, active === tab.id && styles.tabButtonActive]}>
                <Text style={[
                    styles.tabText,
                    active === tab.id && styles.tabTextActive
                  ]}> {tab.label}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>

        {/* Search - Solo mostrar en Confianza y Temporal */}
        {active !== 'companion' && (
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#7A33CC" style={styles.searchIcon} />
            <TextInput
              placeholder={t('groups.layout.search')}
              placeholderTextColor="#999"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        )}
        {/* sub‑pantallas: trusted/temporal/companion */}
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <Slot />
        </View>
      </SafeAreaView>
    </SearchContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
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
    // hacerla mas ancha
    paddingVertical: 20,
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
    marginHorizontal: 40,
    marginVertical: 16,
    paddingHorizontal: 5,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 18,
    left: 3,
    color: '#333',
  },
  searchIcon: {
    left: 8,
  },
});
