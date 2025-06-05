import React, { useState } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    TextInput,
    Platform,
} from 'react-native';
import { CountryCode } from 'react-native-country-picker-modal';
import PhoneNumberPicker from '@/components/PhoneNumberPicker';
import { EmergencyContact } from '@/api/types';

type Props = {
    onSave: (contact: EmergencyContact) => void;
    onCancel: () => void;
};

export default function ManualContactForm({ onSave, onCancel }: Props) {
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState<CountryCode>('ES');
    const [callingCode, setCallingCode] = useState('34');

    const handleSave = () => {
        if (!name || !phoneNumber) return;

        const formattedPhone = `+${callingCode}${phoneNumber.replace(/\D/g, '')}`;
        
        onSave({ 
            name, 
            phone: formattedPhone,
            confirmed: true,
        });
        
        setName('');
        setPhoneNumber('');
    };

    return (
        <View>
            <Text style={styles.modalTitle}>Add Contact Manually</Text>
            
            <TextInput
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                style={styles.input}
            />
            
            <View style={styles.phoneContainer}>
                <PhoneNumberPicker
                    onChange={({ countryCode, callingCode }) => {
                        setCountryCode(countryCode);
                        setCallingCode(callingCode);
                    }}
                />

                <TextInput
                    placeholder="Phone Number"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    style={styles.phoneInput}
                />
            </View>
            
            <Pressable style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveText}>Save Contact</Text>
            </Pressable>
            
            <Pressable onPress={onCancel} style={{ marginTop: 10 }}>
                <Text style={{ color: '#888', textAlign: 'center' }}>Back</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#F1EAFD',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
        marginHorizontal: 20,
    },
    phoneContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 16,
    },
    phoneInput: {
        flex: 1,
        backgroundColor: '#F1EAFD',
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        padding: 12,
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: '#7A33CC',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        width: 250,
        height: 47,
        alignSelf: 'center',
        marginTop: 10,
    },
    saveText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
});
