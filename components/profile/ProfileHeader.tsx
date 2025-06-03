// File: components/profile/ProfileHeader.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { User } from '@/lib/storage/useUserStorage';

interface profileHeaderProps {
  user: User;
  showMenu: boolean;
  onToggleMenu: () => void;
  onEdit: () => void;
  onLogout: () => void;
  onDelete: () => void;
}

export default function ProfileHeader({
  user,
  showMenu,
  onToggleMenu,
  onEdit,
  onLogout,
  onDelete,
}: profileHeaderProps) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity onPress={onToggleMenu}>
          <Ionicons name="ellipsis-vertical" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {showMenu && (
        <View style={styles.menuPopup}>
          <TouchableOpacity style={styles.menuItem} onPress={onEdit}>
            <Feather name="edit" size={20} color="#7A33CC" />
            <Text style={styles.menuItemText}>Editar perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={onDelete}>
            <MaterialIcons name="delete" size={20} color="#FF3B30" />
            <Text style={[styles.menuItemText, { color: '#FF3B30' }]}>Eliminar cuenta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
            <MaterialIcons name="logout" size={20} color="#7A33CC" />
            <Text style={styles.menuItemText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.profileCard}>
        <View style={styles.profileImageContainer}>
          <Image
            source={user.image ? { uri: user.image } : require('@/assets/images/aegis.png')}
            style={styles.profileImage}
          />
          {user.verify && (
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={24} color="#3232C3" />
            </View>
          )}
        </View>

        <Text style={styles.userName}>{user.name}</Text>
        <View style={styles.verifiedTextContainer}>
          {user.verify ? (
            <>
              <MaterialIcons name="verified-user" size={18} color="#3232C3" />
              <Text style={styles.verifiedText}>Cuenta verificada</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="error" size={18} color="#FF9500" />
              <Text style={[styles.verifiedText, { color: '#FF9500' }]}>Cuenta sin verificar</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#7A33CC',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  menuPopup: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 100 : 70,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    margin: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#7A33CC',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 2,
    borderWidth: 2,
    borderColor: '#7A33CC',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  verifiedTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  verifiedText: {
    marginLeft: 5,
    color: '#3232C3',
    fontSize: 14,
  },
});
