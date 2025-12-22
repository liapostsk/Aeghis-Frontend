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
    paddingVertical: 16,
    marginBottom: "7%",
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB' 
  },
  inputWrapper: {
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: { flex: 1, fontSize: 16, color: '#374151', minHeight: 20, maxHeight: 100 },
  sendButton: { marginLeft: 8, padding: 4 },
});
