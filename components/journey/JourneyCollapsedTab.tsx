import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Group } from '@/api/backend/group/groupType';
import { JourneyDto } from '@/api/backend/journeys/journeyType';

interface GroupWithJourney {
  group: Group;
  activeJourney: JourneyDto;
}

interface JourneyCollapsedTabProps {
  groupJourney?: GroupWithJourney | null;
  onExpand: () => void;
}

export default function JourneyCollapsedTab({ groupJourney, onExpand }: JourneyCollapsedTabProps) {
  if (groupJourney) {
    return (
      <View style={styles.collapsedContainer}>
        <Pressable style={styles.collapsedContent} onPress={onExpand}>
          <View style={styles.collapsedHeader}>
            <View style={styles.collapsedIconContainer}>
              <View 
                style={[
                  styles.statusDot, 
                  { backgroundColor: groupJourney.activeJourney.state === 'IN_PROGRESS' ? '#4CAF50' : '#FF9800' }
                ]} 
              />
              <Ionicons name="navigate-circle" size={20} color="#4CAF50" />
            </View>
            <View style={styles.collapsedInfo}>
              <Text style={styles.collapsedTitle}>Trayecto Activo</Text>
              <Text style={styles.collapsedSubtitle}>
                {groupJourney.activeJourney.state === 'IN_PROGRESS' ? 'En progreso' : 'Pendiente'} • 
                {' '}{groupJourney.group.name}
              </Text>
            </View>
            <Ionicons name="chevron-up" size={20} color="#6B7280" />
          </View>
        </Pressable>
      </View>
    );
  }

  // Si no hay journey, mostrar tab simple
  return (
    <View style={styles.collapsedContainer}>
      <Pressable style={styles.collapsedContent} onPress={onExpand}>
        <View style={styles.collapsedHeader}>
          <View style={styles.collapsedIconContainer}>
            <Ionicons name="location" size={20} color="#7A33CC" />
          </View>
          <View style={styles.collapsedInfo}>
            <Text style={styles.collapsedTitle}>Aegis</Text>
            <Text style={styles.collapsedSubtitle}>Tap para iniciar un trayecto</Text>
          </View>
          <Ionicons name="chevron-up" size={20} color="#6B7280" />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  collapsedContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  collapsedContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  collapsedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  collapsedIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  collapsedInfo: {
    flex: 1,
  },
  collapsedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  collapsedSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});
