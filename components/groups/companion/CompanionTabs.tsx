import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface CompanionTabsProps {
  activeTab: 'explore' | 'mine';
  onTabChange: (tab: 'explore' | 'mine') => void;
}

export default function CompanionTabs({ activeTab, onTabChange }: CompanionTabsProps) {
  const { t } = useTranslation();
  
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.tab, activeTab === 'explore' && styles.tabActive]}
        onPress={() => onTabChange('explore')}
      >
        <Ionicons
          name={activeTab === 'explore' ? 'compass' : 'compass-outline'}
          size={20}
          color={activeTab === 'explore' ? '#7A33CC' : '#6B7280'}
        />
        <Text style={[styles.tabText, activeTab === 'explore' && styles.tabTextActive]}>
          {t('companion.tabs.explore')}
        </Text>
      </Pressable>

      <Pressable
        style={[styles.tab, activeTab === 'mine' && styles.tabActive]}
        onPress={() => onTabChange('mine')}
      >
        <Ionicons
          name={activeTab === 'mine' ? 'briefcase' : 'briefcase-outline'}
          size={20}
          color={activeTab === 'mine' ? '#7A33CC' : '#6B7280'}
        />
        <Text style={[styles.tabText, activeTab === 'mine' && styles.tabTextActive]}>
          {t('companion.tabs.mine')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#7A33CC',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#7A33CC',
    fontWeight: '600',
  },
});
