// File: components/profile/ProfileHeader.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { User } from '@/lib/storage/useUserStorage';

interface profileHeaderProps {
  user: User;
  onToggleMenu: () => void;
  onEdit: () => void;
}

export default function ProfileHeader({
  user,
  onEdit,
}: profileHeaderProps) {

  const [showUserInfo, setShowUserInfo] = useState(false);

  return (
    <View>
      
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
