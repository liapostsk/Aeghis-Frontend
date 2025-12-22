import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface ExitGroupButtonProps {
  isLastMember: boolean;
  onPress: () => void;
}

export default function ExitGroupButton({ isLastMember, onPress }: ExitGroupButtonProps) {
  const { t } = useTranslation();
  
  return (
    <View style={styles.exitButtonContainer}>
      <Pressable style={styles.exitButton} onPress={onPress}>
        <Ionicons 
          name={isLastMember ? "trash-outline" : "exit-outline"} 
          size={20} 
          color="#FFFFFF" 
        />
        <Text style={styles.exitButtonText}>
          {isLastMember ? t('chatComponents.exitButton.delete') : t('chatComponents.exitButton.leave')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  exitButtonContainer: { padding: 16, marginBottom: "10%" },
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
  exitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
