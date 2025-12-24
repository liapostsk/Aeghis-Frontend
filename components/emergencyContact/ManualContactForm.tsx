import { useState } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    TextInput,
} from 'react-native';
import PhoneNumberPicker from '@/components/ui/PhoneNumberPicker';
import { Contact } from '@/api/backend/types';
import { useTranslation } from 'react-i18next';

type Props = {
    onSave: (contact: Contact) => void;
    onCancel: () => void;
};

export default function ManualContactForm({ onSave, onCancel }: Props) {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [relation, setRelation] = useState('');
    const [countryCode, setCountryCode] = useState('ES');
    const [callingCode, setCallingCode] = useState('34');

    const handleSave = () => {
        if (!name.trim() || !phoneNumber.trim()) return;

        const formattedPhone = `${callingCode}${phoneNumber.replace(/\D/g, '')}`;

        console.log("numero de telefono formateado:", formattedPhone);
        
        onSave({ 
            name: name.trim(), 
            phone: formattedPhone,
            relation: relation.trim(),
        });
        
        setName('');
        setPhoneNumber('');
        setRelation('');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.modalTitle}>{t('emergencyContact.manualForm.title')}</Text>
            
            <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('emergencyContact.manualForm.nameLabel')}</Text>
                    <TextInput
                        placeholder={t('emergencyContact.manualForm.namePlaceholder')}
                        placeholderTextColor="#9CA3AF"
                        value={name}
                        onChangeText={setName}
                        style={styles.input}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('emergencyContact.manualForm.relationLabel')}</Text>
                    <TextInput
                        placeholder={t('emergencyContact.manualForm.relationPlaceholder')}
                        placeholderTextColor="#9CA3AF"
                        value={relation}
                        onChangeText={setRelation}
                        style={styles.input}
                    />
                </View>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('emergencyContact.manualForm.phoneLabel')}</Text>
                    <View style={styles.phoneContainer}>
                        <PhoneNumberPicker
                            onChange={({ countryCode, callingCode }) => {
                                setCountryCode(countryCode);
                                setCallingCode(callingCode);
                            }}
                        />

                        <TextInput
                            placeholder={t('emergencyContact.manualForm.phonePlaceholder')}
                            placeholderTextColor="#9CA3AF"
                            keyboardType="phone-pad"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            style={styles.phoneInput}
                        />
                    </View>
                </View>
            </View>
            
            <View style={styles.buttonContainer}>
                <Pressable 
                    style={[
                        styles.saveButton, 
                        (!name.trim() || !phoneNumber.trim()) && styles.saveButtonDisabled
                    ]} 
                    onPress={handleSave}
                    disabled={!name.trim() || !phoneNumber.trim()}
                >
                    <Text style={styles.saveText}>
                        {t('emergencyContact.manualForm.save')}
                    </Text>
                </Pressable>
                
                <Pressable onPress={onCancel} style={styles.cancelButton}>
                    <Text style={styles.cancelText}>{t('emergencyContact.manualForm.cancel')}</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 10,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
        color: '#1F2937',
    },
    formContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#1F2937',
    },
    phoneContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    phoneInput: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#1F2937',
    },
    buttonContainer: {
        paddingHorizontal: 20,
        gap: 12,
    },
    saveButton: {
        backgroundColor: '#7A33CC',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        height: 52,
        shadowColor: '#7A33CC',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonDisabled: {
        backgroundColor: '#D1D5DB',
        shadowOpacity: 0,
        elevation: 0,
    },
    saveText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
    },
    cancelText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '500',
    },
});
