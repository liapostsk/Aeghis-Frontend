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
import { UserDto } from '@/api/types';
import { Group } from '@/api/group/groupType';
import { useAuth } from '@clerk/clerk-expo';
import { useTokenStore } from '@/lib/auth/tokenStore';
import { 
    deleteGroup, 
    exitGroup, 
    getGroupById, 
    promoteToAdmin, 
    demoteToMember, 
    removeMember 
} from '@/api/group/groupApi';
import { getUser, getCurrentUser } from '@/api/user/userApi';
// Importaciones de Firebase - funciones restauradas
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
    
    // Estados para modales de confirmación
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [showExitGroupModal, setShowExitGroupModal] = useState(false);
    const [showEditGroupModal, setShowEditGroupModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<UserDto | null>(null);

    // Helper functions
    const getMemberRole = (userId: number) => memberRoles[userId] || 'member';
    const isCurrentUser = (userId: number) => userId === currentUserId;
    const getFirebaseStatus = (clerkId: string) => memberFirebaseStatus[clerkId] || { isOnline: false };

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
                
                // Cargar todos los miembros usando UserDto
                const memberPromises = groupData.membersIds.map(async (memberId) => {
                    try {
                        return await getUser(memberId);
                    } catch (error) {
                        console.error(`Error loading user ${memberId}:`, error);
                        // Fallback básico si no se puede cargar el usuario
                        return {
                            id: memberId,
                            name: 'Usuario desconocido',
                            email: 'unknown@example.com',
                            phone: '',
                            image: '',
                            verify: false,
                            dateOfBirth: new Date(),
                            acceptedPrivacyPolicy: false,
                            safeLocations: [],
                        } as UserDto;
                    }
                });
                
                const loadedMembers = await Promise.all(memberPromises);
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
                
                // 3. Actualizar estado local directamente (más eficiente que recargar)
                setMembers(prev => prev.filter(m => m.id !== selectedMember.id));
                
                // 4. Actualizar roles (eliminar el rol del miembro removido)
                setMemberRoles(prev => {
                    const updated = { ...prev };
                    delete updated[selectedMember.id];
                    return updated;
                });
                
                // 5. Actualizar el grupo (quitar de membersIds y adminsIds)
                setGroup({
                    ...group,
                    membersIds: group.membersIds.filter(id => id !== selectedMember.id),
                    adminsIds: group.adminsIds.filter(id => id !== selectedMember.id),
                });
                
                Alert.alert('Éxito', `${selectedMember.name} ha sido eliminado del grupo`);
                
            } catch (error) {
                console.error('💥 Error eliminando miembro:', error);
                Alert.alert('Error', 'No se pudo eliminar el miembro. Verifica que tienes permisos de administrador.');
                
                // Recargar datos en caso de error
                try {
                    const groupData = await getGroupById(group.id);
                    setGroup(groupData);
                    
                    const loadedMembers = await Promise.all(
                        groupData.membersIds.map(id => getUser(id))
                    );
                    setMembers(loadedMembers);
                    
                    // Actualizar roles basados en el grupo recargado
                    const roles: Record<number, 'admin' | 'member'> = {};
                    groupData.membersIds.forEach(memberId => {
                        roles[memberId] = groupData.adminsIds.includes(memberId) ? 'admin' : 'member';
                    });
                    setMemberRoles(roles);
                    
                } catch (reloadError) {
                    console.error('Error recargando datos:', reloadError);
                }
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
                Alert.alert('Error', 'No se pudo promover el miembro. Verifica que tienes permisos de administrador.');
                
                // Revertir cambio local si falló
                setMemberRoles(prev => ({ ...prev, [selectedMember.id]: 'member' }));
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
            const isLastMember = members.length <= 1;
            
            if (isLastMember) {
                // Si eres el último miembro, eliminar el grupo
                console.log('🗑️ Eres el último miembro, eliminando grupo...');
                
                // 1. Eliminar de Firebase primero
                await deleteGroupFirebase(group.id.toString());
                console.log('✅ Grupo eliminado de Firebase');
                
                // 2. Eliminar del backend
                await deleteGroup(group.id);
                console.log('✅ Grupo eliminado del backend');
                
                Alert.alert('Grupo eliminado', 'El grupo ha sido eliminado exitosamente');
                router.replace('/groups');
                
            } else {
                // Salir del grupo normalmente
                console.log('🚪 Saliendo del grupo...');
                
                // 1. Salir del backend
                await exitGroup(group.id, currentUserId);
                console.log('✅ Usuario removido del grupo en backend');
                
                // 2. Actualizar Firebase si tengo clerkId
                const currentUser = await getCurrentUser();
                if (currentUser.clerkId) {
                    await removeMemberFromGroupFirebase(group.id.toString(), currentUser.clerkId);
                    console.log('✅ Usuario removido de Firebase');
                }
                
                Alert.alert('Has salido del grupo', 'Has abandonado el grupo exitosamente');
                // 
                router.replace('/chat');
            }
            
        } catch (error: any) {
            console.error('💥 Error al salir/eliminar grupo:', error);
            console.error('📋 Error details:', {
                message: error?.message,
                status: error?.response?.status,
                data: error?.response?.data
            });
            
            // Mensaje de error más específico
            if (members.length <= 1) {
                Alert.alert(
                    'Error al eliminar grupo', 
                    error?.response?.data?.message || 'No se pudo eliminar el grupo. Verifica que tienes permisos de administrador.'
                );
            } else {
                Alert.alert(
                    'Error', 
                    error?.response?.data?.message || 'No se pudo salir del grupo'
                );
            }
        }
        
        setShowExitGroupModal(false);
    };

    // Componente para renderizar cada miembro
    const renderMember = (user: UserDto) => {
        const initials = user.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase();

        const isOwn = isCurrentUser(user.id);
        const role = getMemberRole(user.id);
        const displayName = isOwn ? 'Tú' : user.name;
        const isCurrentUserAdmin = getMemberRole(currentUserId || 0) === 'admin';
        
        // Obtener estado de Firebase
        const firebaseStatus = getFirebaseStatus(user.clerkId || '');
        const isOnline = firebaseStatus.isOnline;
        const lastSeen = firebaseStatus.lastSeen;

        return (
            <View key={user.id} style={styles.memberCard}>
                {/* Avatar */}
                <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{initials}</Text>
                    <View style={[
                        styles.statusIndicator, 
                        isOnline ? styles.onlineIndicator : styles.offlineIndicator
                    ]} />
                </View>

                {/* Info */}
                <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{displayName}</Text>
                    <Text style={styles.memberPhone}>{user.phone}</Text>
                    <View style={styles.memberMeta}>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleBadgeText}>
                                {role === 'admin' ? 'Administrador' : 'Miembro'}
                            </Text>
                        </View>
                        <Text style={[styles.memberDate, !isOnline && styles.offlineText]}>
                            {isOnline ? 'En línea' : lastSeen ? `Visto ${lastSeen.toLocaleDateString()}` : 'Desconectado'}
                        </Text>
                    </View>
                </View>

                {/* Admin Actions - Solo si el usuario actual es admin y no es el mismo usuario */}
                {isCurrentUserAdmin && !isOwn && (
                    <View style={styles.adminActions}>
                        {role === 'member' ? (
                            <Pressable
                                onPress={() => handlePromoteToAdmin(user)}
                                style={styles.adminButton}
                            >
                                <Ionicons name="shield" size={16} color="#7A33CC" />
                            </Pressable>
                        ) : (
                            <Pressable
                                onPress={() => handleDemoteToMember(user)}
                                style={[styles.adminButton, styles.warningButton]}
                            >
                                <Ionicons name="shield-outline" size={16} color="#F59E0B" />
                            </Pressable>
                        )}
                        <Pressable
                            onPress={() => handleRemoveMember(user)}
                            style={[styles.adminButton, styles.dangerButton]}
                        >
                            <Ionicons name="trash" size={16} color="#EF4444" />
                        </Pressable>
                    </View>
                )}
            </View>
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

            {/* Contenido principal con fondo blanco */}
            <View style={styles.body}>
                <ScrollView
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                bounces
                >
                    {/* Información del grupo */}
                    <View style={styles.groupCard}>
                        <View style={styles.groupHeader}>
                            <View style={styles.groupIcon}>
                                <Ionicons name="people" size={40} color="#7A33CC" />
                            </View>
                            <View style={styles.groupDetails}>
                                <Text style={styles.groupName}>{group.name}</Text>
                                <Text style={styles.groupType}>
                                {group.type?.charAt(0).toUpperCase() + group.type?.slice(1).toLowerCase()}
                                </Text>
                                <Text style={styles.groupMembers}>
                                {members.length} miembro{members.length !== 1 ? 's' : ''}
                                </Text>
                            </View>
                            <Pressable 
                                style={styles.editButton}
                                onPress={() => setShowEditGroupModal(true)}
                            >
                                <Text style={styles.editButtonText}>Editar</Text>
                            </Pressable>
                        </View>

                        {group.description && (
                        <Text style={styles.groupDescription}>{group.description}</Text>
                        )}

                        <View style={styles.groupStats}>
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>{members.length}</Text>
                                <Text style={styles.statLabel}>Participantes</Text>
                            </View>
                            <View style={[styles.stat, styles.statBorder]}>
                                <Text style={styles.statValue}>
                                {Object.values(memberFirebaseStatus).filter(status => status.isOnline).length}
                                </Text>
                                <Text style={styles.statLabel}>En línea</Text>
                            </View>
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>
                                {Object.values(memberRoles).filter(role => role === 'admin').length}
                                </Text>
                                <Text style={styles.statLabel}>Administradores</Text>
                            </View>
                        </View>
                    </View>

                    {/* Acciones */}
                    <View style={styles.actionsContainer}>
                        <Pressable 
                            style={styles.actionButton} 
                            onPress={() => router.push(`/chat/journey?groupId=${groupId}`)}
                        >
                            <Ionicons name="location-outline" size={20} color="#7A33CC" />
                            <Text style={styles.actionButtonText}>Empezar trayecto</Text>
                        </Pressable>
                    </View>

                    {/* Lista de miembros */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Miembros</Text>
                    </View>
                    {/* Invitar miembros como primer elemento */}
                    <Pressable 
                        style={styles.inviteMemberCard}
                        onPress={() => setShowInviteModal(true)}
                    >
                        <View style={styles.inviteMemberAvatar}>
                            <Ionicons name="share-outline" size={20} color="#7A33CC" />
                        </View>
                        <View style={styles.inviteMemberInfo}>
                            <Text style={styles.inviteMemberText}>Invitar miembros</Text>
                        </View>
                    </Pressable>
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
                <View style={styles.exitButtonContainer}>
                    <Pressable
                        style={styles.exitButton}
                        onPress={handleExitGroup}
                    >
                        <Ionicons 
                            name={members.length <= 1 ? "trash-outline" : "exit-outline"} 
                            size={20} 
                            color="#FFFFFF" 
                        />
                        <Text style={styles.exitButtonText}>
                            {members.length <= 1 ? "Eliminar grupo" : "Salir del grupo"}
                        </Text>
                    </Pressable>
                </View>

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

  // Group Card
  groupCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  groupHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16,
    position: 'relative',
  },
  groupIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupDetails: { flex: 1 },
  groupName: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  groupType: { fontSize: 14, color: '#7A33CC', fontWeight: '500', marginTop: 2 },
  groupMembers: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  groupDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },

  // Stats
  groupStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  stat: { alignItems: 'center', flex: 1 },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E5E7EB' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#7A33CC' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A33CC',
  },

  // Section
  sectionHeader: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },

  // Member Card
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7A33CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  memberAvatarText: { color: 'white', fontWeight: '700', fontSize: 12 },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: 'white',
  },
  onlineIndicator: {
    backgroundColor: '#22C55E',
  },
  offlineIndicator: {
    backgroundColor: '#EF4444',
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  memberPhone: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  memberMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  roleBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '600', color: '#7A33CC' },
  memberDate: { fontSize: 11, color: '#9CA3AF' },
  offlineText: { color: '#EF4444' },

  // Admin Actions
  adminActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  adminButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButton: {
    backgroundColor: '#FEF2F2',
  },
  warningButton: {
    backgroundColor: '#FFFBEB',
  },

  // Exit Button
  exitButtonContainer: {
    padding: 16,
    marginBottom: "10%",
  },
  exitButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  exitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Invite Member Card
  inviteMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inviteMemberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#7A33CC',
  },
  inviteMemberInfo: {
    flex: 1,
  },
  inviteMemberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A33CC',
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  editButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  editButtonText: {
    fontSize: 14,
    color: '#7A33CC',
    fontWeight: '600',
  },
});