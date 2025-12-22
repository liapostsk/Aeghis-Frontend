import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MessageBubbleProps {
  id: string;
  content: string;
  time: string;
  senderName?: string;
  isUser: boolean;
  isRead?: boolean;
  type?: 'message' | 'status' | 'arrival';
}

export default function MessageBubble({
  content,
  time,
  senderName,
  isUser,
  isRead = false,
  type = 'message',
}: MessageBubbleProps) {
  // Mensaje de llegada
  if (type === 'arrival') {
    return (
      <View style={styles.arrivalContainer}>
        <View style={styles.arrivalBubble}>
          <Text style={styles.arrivalText}>{content}</Text>
        </View>
        <Text style={styles.arrivalTime}>{time}</Text>
      </View>
    );
  }

  // Mensaje del usuario
  if (isUser) {
    return (
      <View style={styles.userMessageContainer}>
        <View style={styles.userBubble}>
          <Text style={styles.userMessageText}>{content}</Text>
        </View>
        <View style={styles.userMessageInfo}>
          <Text style={styles.messageTime}>{time}</Text>
          <View style={styles.checkMarkContainer}>
            {isRead ? (
              <>
                <Ionicons name="checkmark" size={12} style={[styles.checkIcon, styles.doubleCheck]} />
                <Ionicons name="checkmark" size={12} style={[styles.checkIcon, styles.doubleCheck, styles.secondCheck]} />
              </>
            ) : (
              <Ionicons name="checkmark" size={12} style={styles.checkIcon} />
            )}
          </View>
        </View>
      </View>
    );
  }

  // Mensaje de otro usuario
  return (
    <View style={styles.otherMessageContainer}>
      <Text style={styles.senderName}>{senderName}</Text>
      <View style={styles.otherBubble}>
        <Text style={styles.otherMessageText}>{content}</Text>
      </View>
      <Text style={styles.messageTime}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  arrivalContainer: { alignItems: 'center', marginVertical: 8 },
  arrivalBubble: { backgroundColor: '#BBF7D0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  arrivalText: { color: '#166534', fontSize: 14, fontWeight: '500' },
  arrivalTime: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  
  userMessageContainer: { alignItems: 'flex-end', marginVertical: 4 },
  userBubble: {
    backgroundColor: '#7A33CC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    maxWidth: '80%',
  },
  userMessageText: { color: 'white', fontSize: 14 },
  userMessageInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  checkMarkContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  checkIcon: { marginLeft: 4, color: '#9CA3AF' },
  doubleCheck: { color: '#7A33CC' },
  secondCheck: { marginLeft: -8 },
  
  otherMessageContainer: { alignItems: 'flex-start', marginVertical: 4, maxWidth: '80%' },
  senderName: { color: '#374151', fontSize: 12, fontWeight: '500', marginBottom: 4 },
  otherBubble: { backgroundColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderBottomLeftRadius: 4 },
  otherMessageText: { color: '#374151', fontSize: 14 },
  messageTime: { color: '#6B7280', fontSize: 12, marginTop: 4 },
});
