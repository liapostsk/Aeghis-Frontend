import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  sender: string;
  content: string;
  time: string;
  isUser?: boolean;
  type?: 'message' | 'status' | 'arrival';
}

type ChatProps = {
  onGoBack?: () => void;
};

const messages: Message[] = [
  {
    id: '1',
    sender: 'Alex',
    content: 'Just left the club. On my way',
    time: '21:35',
    type: 'message'
  },
  {
    id: '2', 
    sender: 'Maria',
    content: 'Perfect, I\'m going with Lia',
    time: '21:37',
    type: 'message'
  },
  {
    id: '3',
    sender: 'User',
    content: 'Yes!! Keep updating Alex',
    time: '21:35',
    isUser: true,
    type: 'message'
  },
  {
    id: '4',
    sender: 'Alex',
    content: 'Alex arrive to Home',
    time: '22:02',
    type: 'arrival'
  },
  {
    id: '5',
    sender: 'Alex',
    content: 'Everything is fine, I see on the map that you too are close to your destinations',
    time: '22:05',
    type: 'message'
  },
  {
    id: '6',
    sender: 'Maria',
    content: 'Maria arrive to Home',
    time: '22:15',
    type: 'arrival'
  },
  {
    id: '7',
    sender: 'User',
    content: 'I\'ll be at home in 10 minutes',
    time: '21:20',
    isUser: true,
    type: 'message'
  }
];

export default function ChatScreen({ onGoBack }: ChatProps) {
  const [inputText, setInputText] = useState('');

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.type === 'arrival') {
      return (
        <View style={styles.arrivalContainer}>
          <View style={styles.arrivalBubble}>
            <Text style={styles.arrivalText}>{item.content}</Text>
          </View>
          <Text style={styles.arrivalTime}>{item.time}</Text>
        </View>
      );
    }

    if (item.isUser) {
      return (
        <View style={styles.userMessageContainer}>
          <View style={styles.userBubble}>
            <Text style={styles.userMessageText}>{item.content}</Text>
          </View>
          <View style={styles.userMessageInfo}>
            <Text style={styles.messageTime}>{item.time}</Text>
            <Ionicons name="checkmark" size={12} color="#7A33CC" style={styles.checkIcon} />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.otherMessageContainer}>
        <Text style={styles.senderName}>{item.sender}:</Text>
        <View style={styles.otherBubble}>
          <Text style={styles.otherMessageText}>{item.content}</Text>
        </View>
        <Text style={styles.messageTime}>{item.time}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7A33CC" translucent={false} />
      
      {/* Header */}
      <View style={styles.header}>
          <Text style={styles.headerTitle}>Return Safe Buddies</Text>
          <View style={styles.headerSubtitle}>
            <Text style={styles.headerSubtitleText}>3 members</Text>
            <Text style={styles.headerDot}> • </Text>
            <View style={styles.activeIndicator} />
            <Text style={styles.headerSubtitleText}>Active now</Text>
          </View>
        </View>

      {/* Trip Status */}
      <View style={styles.tripStatus}>
        <Ionicons name="location" size={20} color="#DC2626" style={styles.locationIcon} />
        <View style={styles.tripStatusInfo}>
          <Text style={styles.tripStatusText}>Trip active • Share location active</Text>
          <Text style={styles.showLocationsText}>Show locations</Text>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder=""
            multiline
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#7A33CC',
    paddingTop: 70, // Espacio para el status bar
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerSubtitleText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  headerDot: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 4,
  },
  tripStatus: {
    backgroundColor: '#F3E8FF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    marginRight: 8,
  },
  tripStatusInfo: {
    flex: 1,
  },
  tripStatusText: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '500',
  },
  showLocationsText: {
    color: '#7C3AED',
    fontSize: 12,
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  arrivalContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  arrivalBubble: {
    backgroundColor: '#BBF7D0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  arrivalText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '500',
  },
  arrivalTime: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    marginVertical: 4,
  },
  userBubble: {
    backgroundColor: '#7A33CC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    maxWidth: '80%',
  },
  userMessageText: {
    color: 'white',
    fontSize: 14,
  },
  userMessageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  checkIcon: {
    marginLeft: 4,
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
    marginVertical: 4,
    maxWidth: '80%',
  },
  senderName: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  otherBubble: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  otherMessageText: {
    color: '#374151',
    fontSize: 14,
  },
  messageTime: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 25,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    bottom: 5
  },
  textInput: {
    fontSize: 16,
    color: '#374151',
    minHeight: 20,
  },
});