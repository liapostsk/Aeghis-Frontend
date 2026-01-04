import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Group } from '@/api/backend/group/groupType';
import CreateGroupModal from '@/components/groups/CreateGroupModal';
import JoinGroupModal from '@/components/groups/JoinGroupModal';
import GroupTypeSelector from '@/components/groups/GroupTypeSelector';
import { useTranslation } from 'react-i18next';

interface GroupOptionsSheetProps {
  userGroups: Group[];
  showCreateGroupModal: boolean;
  showJoinGroupModal: boolean;
  showGroupTypeSelector: boolean;
  selectedGroupType: 'CONFIANZA' | 'TEMPORAL' | null;
  onClose: () => void;
  onGroupSelected: (group: Group) => void;
  onCreateGroup: () => void;
  onJoinGroup: () => void;
  onCreateGroupWithType: (type: 'CONFIANZA' | 'TEMPORAL') => void;
  onGroupCreated: (groupId?: number) => void;
  onJoinGroupSuccess?: (groupId?: number) => void;
  setShowCreateGroupModal: (show: boolean) => void;
  setShowJoinGroupModal: (show: boolean) => void;
  setShowGroupTypeSelector: (show: boolean) => void;
  setSelectedGroupType: (type: 'CONFIANZA' | 'TEMPORAL' | null) => void;
  onLayout?: (event: any) => void;
}

export default function GroupOptionsSheet({
  userGroups,
  showCreateGroupModal,
  showJoinGroupModal,
  showGroupTypeSelector,
  selectedGroupType,
  onClose,
  onGroupSelected,
  onCreateGroup,
  onJoinGroup,
  onCreateGroupWithType,
  onGroupCreated,
  onJoinGroupSuccess,
  setShowCreateGroupModal,
  setShowJoinGroupModal,
  setShowGroupTypeSelector,
  setSelectedGroupType,
  onLayout
}: GroupOptionsSheetProps) {
  const { t } = useTranslation();
  const hasGroups = userGroups.length > 0;

  return (
    <>
      <View 
        style={styles.sheetContent}
        onLayout={onLayout}
      >
        <View style={styles.sheetHeader}>
        <View style={styles.headerLeft}>
          <Ionicons name="location" size={24} color="#7A33CC" />
          <Text style={styles.sheetTitle}>
            {hasGroups ? t('groupOptionsSheet.startJourney') : t('groupOptionsSheet.createFirstJourney')}
          </Text>
        </View>
        <Pressable onPress={onClose} style={styles.collapseButton}>
          <Ionicons name="close" size={20} color="#6B7280" />
        </Pressable>
      </View>

      <Text style={styles.subtitle}>
        {hasGroups 
          ? `${t('groupOptionsSheet.groupsAvailable', { count: userGroups.length })} ${t('groupOptionsSheet.whichToStart')}`
          : t('groupOptionsSheet.needGroupToStart')
        }
      </Text>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.optionsContainer}
        showsVerticalScrollIndicator={false}
      >
        {hasGroups ? (
          <>
            <Text style={styles.sectionTitle}>{t('groupOptionsSheet.yourGroups')}</Text>
            {userGroups.map((group) => (
              <Pressable 
                key={group.id} 
                style={styles.groupCard} 
                onPress={() => onGroupSelected(group)}
              >
                <View style={styles.groupIcon}>
                  <Ionicons 
                    name={group.type === 'CONFIANZA' ? 'shield' : group.type === 'TEMPORAL' ? 'time' : 'people'} 
                    size={24} 
                    color="#7A33CC" 
                  />
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupType}>
                    {group.type} • {group.membersIds.length} {group.membersIds.length > 1 ? t('groupOptionsSheet.members') : t('groupOptionsSheet.member')}
                  </Text>
                  {group.description && (
                    <Text style={styles.groupDescription}>{group.description}</Text>
                  )}
                </View>
                <View style={styles.startJourneyButton}>
                  <Ionicons name="play-circle" size={32} color="#4CAF50" />
                </View>
              </Pressable>
            ))}
            
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>{t('groupOptionsSheet.moreOptions')}</Text>
          </>
        ) : null}

        {/* Crear nuevo grupo */}
        <Pressable style={styles.optionCard} onPress={onCreateGroup}>
          <View style={styles.optionIcon}>
            <Ionicons name="add-circle" size={32} color="#4CAF50" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>
              {hasGroups ? t('groupOptionsSheet.createAnotherGroup') : t('groupOptionsSheet.createGroup')}
            </Text>
            <Text style={styles.optionDescription}>
              {hasGroups 
                ? t('groupOptionsSheet.createNewGroupDesc')
                : t('groupOptionsSheet.createGroupDesc')
              }
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </Pressable>

        {/* Unirse a grupo */}
        <Pressable style={styles.optionCard} onPress={onJoinGroup}>
          <View style={styles.optionIcon}>
            <Ionicons name="person-add" size={32} color="#FF9800" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>{t('groupOptionsSheet.joinGroup')}</Text>
            <Text style={styles.optionDescription}>
              {t('groupOptionsSheet.joinGroupDesc')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </Pressable>
      </ScrollView>
    </View>

      {/* Modales */}
      <GroupTypeSelector
        visible={showGroupTypeSelector}
        onSelectType={onCreateGroupWithType}
        onClose={() => setShowGroupTypeSelector(false)}
      />

      <CreateGroupModal
        visible={showCreateGroupModal}
        onClose={() => {
          setShowCreateGroupModal(false);
          setSelectedGroupType(null);
        }}
        onSuccess={onGroupCreated}
        type={selectedGroupType || 'TEMPORAL'}
      />

      <JoinGroupModal
        visible={showJoinGroupModal}
        onClose={() => setShowJoinGroupModal(false)}
        onSuccess={onJoinGroupSuccess}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    padding: 20,
    paddingBottom: 40,
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  collapseButton: {
    padding: 8,
    borderRadius: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  groupType: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  groupDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  startJourneyButton: {
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
});
