import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder?: string;
}

export default function ChatInput({
  value,
  onChangeText,
  onSend,
  placeholder,
}: ChatInputProps) {
  const { t } = useTranslation();
  
  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || t('chatComponents.input.placeholder')}
          multiline
        />
        {value.trim().length > 0 && (
          <Pressable style={styles.sendButton} onPress={onSend}>
            <Ionicons name="send" size={17} color="#7A33CC" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: { 
    paddingHorizontal: 16, 
    paddingTop: 12,
    paddingBottom: 16,
    marginBottom: "7%",
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  inputWrapper: {
    backgroundColor: '#F9FAFB',
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textInput: { 
    flex: 1, 
    fontSize: 15, 
    color: '#1F2937', 
    minHeight: 22, 
    maxHeight: 100,
    paddingTop: 2,
  },
  sendButton: { 
    marginLeft: 10, 
    padding: 6,
    backgroundColor: '#F3E8FF',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
