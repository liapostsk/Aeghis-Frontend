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
  arrivalContainer: { 
    alignItems: 'center', 
    marginVertical: 12 
  },
  arrivalBubble: { 
    backgroundColor: '#BBF7D0', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  arrivalText: { 
    color: '#166534', 
    fontSize: 13, 
    fontWeight: '600' 
  },
  arrivalTime: { 
    color: '#9CA3AF', 
    fontSize: 11, 
    marginTop: 6 
  },
  
  userMessageContainer: { 
    alignItems: 'flex-end', 
    marginVertical: 6,
    paddingLeft: '20%',
  },
  userBubble: {
    backgroundColor: '#7A33CC',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 20,
    borderBottomRightRadius: 6,
    maxWidth: '100%',
    shadowColor: '#7A33CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  userMessageText: { 
    color: 'white', 
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 4,
    marginRight: 4,
  },
  checkMarkContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginLeft: 6 
  },
  checkIcon: { 
    marginLeft: 2, 
    color: '#9CA3AF' 
  },
  doubleCheck: { 
    color: '#7A33CC' 
  },
  secondCheck: { 
    marginLeft: -8 
  },
  
  otherMessageContainer: { 
    alignItems: 'flex-start', 
    marginVertical: 6,
    paddingRight: '20%',
  },
  senderName: { 
    color: '#6B7280', 
    fontSize: 12, 
    fontWeight: '600', 
    marginBottom: 4,
    marginLeft: 4,
  },
  otherBubble: { 
    backgroundColor: '#F3F4F6', 
    paddingHorizontal: 16, 
    paddingVertical: 11, 
    borderRadius: 20, 
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  otherMessageText: { 
    color: '#1F2937', 
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: { 
    color: '#9CA3AF', 
    fontSize: 11, 
    marginTop: 4,
    marginLeft: 4,
  },
});
