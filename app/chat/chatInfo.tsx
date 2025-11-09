import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserDto } from '@/api/backend/types';
import { Group } from '@/api/backend/group/groupType';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { 
    deleteGroup, 
    exitGroup, 
    getGroupById, 
    promoteToAdmin, 
    demoteToMember, 
    removeMember 
} from '@/api/backend/group/groupApi';
import { getUser, getCurrentUser } from '@/api/backend/user/userApi';
import { 
    removeMemberFromGroupFirebase, 
    makeMemberAdminFirebase, 
    removeAdminFirebase,
    deleteGroupFirebase 
} from '@/api/firebase/chat/chatService';
import { getUserProfileFB } from '@/api/firebase/users/userService';
import AlertModal from '@/components/common/AlertModal';
import InviteModal from '@/components/groups/InviteModal';
import EditGroupModal from '@/components/groups/EditGroupModal';
import { 
    MemberCard, 
    GroupInfoCard, 
    InviteMemberCard, 
    GroupActions,
    ExitGroupButton 
} from '@/components/chat';

export default function GroupInfoScreen() {
    const { groupId } = useLocalSearchParams<{ groupId: string }>();
    const { getToken } = useAuth();
    const setToken = useTokenStore((state) => state.setToken);

    // Estados usando tipos existentes
    const [group, setGroup] = useState<Group | null>(null);
    const [members, setMembers] = useState<UserDto[]>([]);
    const [memberRoles, setMemberRoles] = useState<Record<number, 'admin' | 'member'>>({});
    const [memberFirebaseStatus, setMemberFirebaseStatus] = useState<Record<string, { isOnline: boolean; lastSeen?: Date }>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    
    // Estados para modales
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [showExitGroupModal, setShowExitGroupModal] = useState(false);
    const [showEditGroupModal, setShowEditGroupModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<UserDto | null>(null);

    // Función para cargar datos de Firebase de los miembros
    const loadMembersFirebaseData = async (members: UserDto[]) => {
        const statusMap: Record<string, { isOnline: boolean; lastSeen?: Date }> = {};
        
        for (const member of members) {
            if (member.clerkId) {
                try {
                    // Obtener datos reales de Firebase
                    const fbData = await getUserProfileFB(member.clerkId);
                    statusMap[member.clerkId] = {
                        isOnline: fbData.isOnline || false,
                        lastSeen: fbData.lastSeen?.toDate ? fbData.lastSeen.toDate() : undefined
                    };
                } catch (error) {
                    console.warn(`No se pudieron cargar datos de Firebase para ${member.name}:`, error);
                    // Fallback para usuarios sin datos de Firebase
                    statusMap[member.clerkId] = {
                        isOnline: false,
                        lastSeen: undefined
                    };
                }
            }
        }
        
        return statusMap;
    };

    // Cargar datos del grupo
    useEffect(() => {
        let mounted = true;

        const loadGroupData = async () => {
            try {
                setLoading(true);
                const token = await getToken();
                setToken(token);

                const id = Number(groupId);
                if (!id || Number.isNaN(id)) {
                    throw new Error('Invalid group id');
                }

                const groupData = await getGroupById(id);
                if (!mounted) return;
                
                setGroup(groupData);
                
                // Obtener usuario actual
                const currentUser = await getCurrentUser();
                setCurrentUserId(currentUser.id);
                
                const memberPromises = groupData.membersIds.map(async (memberId) => {
                    try {
                        return await getUser(memberId);
                    } catch (error) {
                        console.error(`Error loading user ${memberId}:`, error);
                        return null;
                    }
                });
                
                const loadedMembers = (await Promise.all(memberPromises)).filter(Boolean) as UserDto[];
                setMembers(loadedMembers);
                
                // Crear mapeo de roles basado en los arrays del grupo
                const roles: Record<number, 'admin' | 'member'> = {};
                groupData.membersIds.forEach(memberId => {
                    roles[memberId] = groupData.adminsIds.includes(memberId) ? 'admin' : 'member';
                });
                setMemberRoles(roles);
                
                // Cargar datos reales de Firebase
                const firebaseStatus = await loadMembersFirebaseData(loadedMembers);
                setMemberFirebaseStatus(firebaseStatus);
                
                setError(null);
            } catch (e: any) {
                if (mounted) setError(e?.message ?? 'Unable to load group');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadGroupData();
        return () => { mounted = false; };
    }, [groupId]);

    // Handlers para gestión de miembros
    const handleRemoveMember = (member: UserDto) => {
        setSelectedMember(member);
        setShowRemoveModal(true);
    };

    const confirmRemoveMember = async () => {
        if (selectedMember && group) {
            try {
                console.log(`🗑️ Eliminando miembro ${selectedMember.name} del grupo ${group.name}`);
                
                const token = await getToken();
                setToken(token);

                // 1. Llamada al backend para remover miembro
                await removeMember(group.id, selectedMember.id);
                console.log('✅ Miembro removido del backend');
                
                // 2. Actualizar Firebase si el usuario tiene clerkId
                if (selectedMember.clerkId) {
                    await removeMemberFromGroupFirebase(group.id.toString(), selectedMember.clerkId);
                    console.log('✅ Miembro removido de Firebase');
                }
                
                // 3. Actualizar estado local
                setMembers(prev => prev.filter(m => m.id !== selectedMember.id));
                setMemberRoles(prev => {
                    const updated = { ...prev };
                    delete updated[selectedMember.id];
                    return updated;
                });
                setGroup({
                    ...group,
                    membersIds: group.membersIds.filter(id => id !== selectedMember.id),
                    adminsIds: group.adminsIds.filter(id => id !== selectedMember.id),
                });
                
                Alert.alert('Éxito', `${selectedMember.name} ha sido eliminado del grupo`);
                
            } catch (error) {
                console.error('💥 Error eliminando miembro:', error);
                Alert.alert('Error', 'No se pudo eliminar el miembro');
            }
        }
        setShowRemoveModal(false);
        setSelectedMember(null);
    };

    const handlePromoteToAdmin = (member: UserDto) => {
        setSelectedMember(member);
        setShowPromoteModal(true);
    };

    const confirmPromoteToAdmin = async () => {
        if (selectedMember && group) {
            try {
                console.log(`👑 Promoviendo ${selectedMember.name} a administrador del grupo ${group.name}`);
                
                const token = await getToken();
                setToken(token);

                // 1. Llamada al backend para promover a admin
                const updatedGroup = await promoteToAdmin(group.id, selectedMember.id);
                console.log('✅ Usuario promovido en backend');
                
                // 2. Actualizar Firebase si el usuario tiene clerkId
                if (selectedMember.clerkId) {
                    await makeMemberAdminFirebase(group.id.toString(), selectedMember.clerkId);
                    console.log('✅ Usuario promovido en Firebase');
                }
                
                // 3. Actualizar estado local
                setGroup(updatedGroup);
                setMemberRoles(prev => ({ ...prev, [selectedMember.id]: 'admin' }));
                
                Alert.alert('Éxito', `${selectedMember.name} ahora es administrador`);
                
            } catch (error) {
                console.error('💥 Error promoviendo miembro:', error);
                Alert.alert('Error', 'No se pudo promover el miembro');
            }
        }
        setShowPromoteModal(false);
        setSelectedMember(null);
    };

    const handleDemoteToMember = async (member: UserDto) => {
        try {
            console.log(`👤 Degradando ${member.name} de administrador a miembro`);
            
            const token = await getToken();
            setToken(token);

            // 1. Llamada al backend para degradar admin
            const updatedGroup = await demoteToMember(group!.id, member.id);
            console.log('✅ Usuario degradado en backend');
            
            // 2. Actualizar Firebase si el usuario tiene clerkId
            if (member.clerkId) {
                await removeAdminFirebase(group!.id.toString(), member.clerkId);
                console.log('✅ Usuario degradado en Firebase');
            }
            
            // 3. Actualizar estado local
            setGroup(updatedGroup);
            setMemberRoles(prev => ({ ...prev, [member.id]: 'member' }));
            
            Alert.alert('Éxito', `${member.name} ya no es administrador`);
            
        } catch (error) {
            console.error('💥 Error degradando admin:', error);
            Alert.alert('Error', 'No se pudo remover los permisos de administrador');
        }
    };

    // Manejar salida o eliminación del grupo
    const handleExitGroup = () => {
        setShowExitGroupModal(true);
    };

    const confirmExitGroup = async () => {
        if (!group || !currentUserId) return;

        try {
            const token = await getToken();
            setToken(token);

            if (members.length <= 1) {
                // Eliminar grupo
                await deleteGroupFirebase(group.id.toString());
                await deleteGroup(group.id);
                
                Alert.alert('Grupo eliminado', 'El grupo ha sido eliminado exitosamente');
                router.replace('/groups');
            } else {
                // Salir del grupo
                await exitGroup(group.id, currentUserId);
                
                const currentUser = await getCurrentUser();
                if (currentUser.clerkId) {
                    await removeMemberFromGroupFirebase(group.id.toString(), currentUser.clerkId);
                }
                
                Alert.alert('Has salido del grupo', 'Has abandonado el grupo exitosamente');
                router.replace('/chat');
            }
        } catch (error: any) {
            console.error('💥 Error al salir/eliminar grupo:', error);
            Alert.alert('Error', 'No se pudo completar la operación');
        }
        
        setShowExitGroupModal(false);
    };

    // Renderizar miembro con componente
    const renderMember = (user: UserDto) => {
        const role = memberRoles[user.id] || 'member';
        const firebaseStatus = memberFirebaseStatus[user.clerkId || ''] || { isOnline: false };
        const isCurrentUserAdmin = (memberRoles[currentUserId || 0] || 'member') === 'admin';

        return (
            <MemberCard
                key={user.id}
                user={user}
                isCurrentUser={user.id === currentUserId}
                role={role}
                isOnline={firebaseStatus.isOnline}
                lastSeen={firebaseStatus.lastSeen}
                isCurrentUserAdmin={isCurrentUserAdmin}
                onPromote={() => handlePromoteToAdmin(user)}
                onDemote={() => handleDemoteToMember(user)}
                onRemove={() => handleRemoveMember(user)}
            />
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
            <ActivityIndicator size="large" color="#7A33CC" />
            <Text style={styles.muted}>Cargando información…</Text>
            </View>
        );
    }

    if (error || !group) {
    return (
        <View style={styles.center}>
        <Text style={styles.error}>{error ?? 'Group not found'}</Text>
        </View>
    );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#7A33CC" />
            
            <SafeAreaView style={styles.topArea}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Información del grupo</Text>
                </View>
            </SafeAreaView>

            <View style={styles.body}>
                <ScrollView
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                bounces
                >
                    {/* Información del grupo */}
                    <GroupInfoCard
                        group={group}
                        membersCount={members.length}
                        onlineCount={Object.values(memberFirebaseStatus).filter(s => s.isOnline).length}
                        adminsCount={Object.values(memberRoles).filter(r => r === 'admin').length}
                        onEdit={() => setShowEditGroupModal(true)}
                    />

                    {/* Acciones */}
                    <GroupActions
                        groupId={group.id}
                        onStartJourney={() => router.push(`/chat/journey?groupId=${groupId}`)}
                    />

                    {/* Lista de miembros */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Miembros</Text>
                    </View>
                    
                    {/* Invitar miembros */}
                    <InviteMemberCard onPress={() => setShowInviteModal(true)} />
                    
                    {/* Miembros */}
                    {members.map(member => renderMember(member))}
                </ScrollView>

                {/* Invite Modal */}
                <InviteModal
                    visible={showInviteModal}
                    onClose={() => setShowInviteModal(false)}
                    groupId={group.id}
                />

                {/* Modal de confirmación para eliminar miembro */}
                <AlertModal
                    visible={showRemoveModal}
                    title="Eliminar miembro"
                    message={`¿Estás seguro de que quieres eliminar a ${selectedMember?.name} del grupo? Esta acción no se puede deshacer.`}
                    type="danger"
                    confirmText="Eliminar"
                    cancelText="Cancelar"
                    onConfirm={confirmRemoveMember}
                    onCancel={() => {
                        setShowRemoveModal(false);
                        setSelectedMember(null);
                    }}
                />

                {/* Modal de confirmación para promover a admin */}
                <AlertModal
                    visible={showPromoteModal}
                    title="Hacer administrador"
                    message={`¿Quieres promover a ${selectedMember?.name} como administrador del grupo?`}
                    type="success"
                    confirmText="Promover"
                    cancelText="Cancelar"
                    onConfirm={confirmPromoteToAdmin}
                    onCancel={() => {
                        setShowPromoteModal(false);
                        setSelectedMember(null);
                    }}
                />

                {/* Botón de salir/eliminar grupo */}
                <ExitGroupButton
                    isLastMember={members.length <= 1}
                    onPress={handleExitGroup}
                />

                {/* Modal de confirmación para salir/eliminar grupo */}
                <AlertModal
                    visible={showExitGroupModal}
                    title={members.length <= 1 ? "Eliminar grupo" : "Salir del grupo"}
                    message={
                        members.length <= 1 
                            ? "Eres el último miembro. ¿Quieres eliminar este grupo? Esta acción no se puede deshacer."
                            : "¿Estás seguro de que quieres salir de este grupo?"
                    }
                    type="danger"
                    confirmText={members.length <= 1 ? "Eliminar" : "Salir"}
                    cancelText="Cancelar"
                    onConfirm={confirmExitGroup}
                    onCancel={() => setShowExitGroupModal(false)}
                />

                {/* Modal de edición del grupo */}
                <EditGroupModal
                    visible={showEditGroupModal}
                    onClose={() => setShowEditGroupModal(false)}
                    group={group}
                    onGroupUpdated={(updatedGroup) => setGroup(updatedGroup)}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#7A33CC' },
  topArea: { backgroundColor: '#7A33CC' },
  body: { flex: 1, backgroundColor: '#FFFFFF' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  muted: { color: '#888', marginTop: 8 },
  error: { color: '#c00' },

  // Header
  header: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: { marginRight: 12, paddingTop: 15 },
  headerTitle: { 
    color: 'white', 
    fontSize: 20, 
    fontWeight: '600', 
    flex: 1,
    paddingTop: 15,
  },

  // List
  listContent: { paddingBottom: 20 },

  // Section
  sectionHeader: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
});