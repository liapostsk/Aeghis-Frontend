// File: components/map/MapHeader.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';

export default function MapHeader({ activeGroup, onToggle }: { activeGroup: any, onToggle?: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.icon}>
        <Icon name="settings-outline" size={24} color="#000" />
      </TouchableOpacity>

      {activeGroup && (
        <TouchableOpacity style={styles.group} onPress={onToggle}>
          <Text style={styles.groupText}>{activeGroup.name}</Text>
          <Icon name="chevron-down" size={24} color="#000" />
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.icon}>
        <Icon name="notifications-outline" size={24} color="#000" />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>1</Text>
        </View>
      </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  icon: {
    padding: 8,
    position: 'relative',
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D3F9D8',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  groupText: {
    fontWeight: 'bold',
    fontSize: 15,
    marginRight: 6,
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
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
