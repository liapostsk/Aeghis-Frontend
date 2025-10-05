import React, { useState } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    TextInput,
} from 'react-native';
import PhoneNumberPicker from '@/components/ui/PhoneNumberPicker';
import { Contact } from '@/api/types';

type Props = {
    onSave: (contact: Contact) => void;
    onCancel: () => void;
};

export default function ManualContactForm({ onSave, onCancel }: Props) {
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [relation, setRelation] = useState('');
    const [countryCode, setCountryCode] = useState('ES');
    const [callingCode, setCallingCode] = useState('34');

    const handleSave = () => {
        if (!name.trim() || !phoneNumber.trim()) return;

        const formattedPhone = `+${callingCode}${phoneNumber.replace(/\D/g, '')}`;
        
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
        <View>
            <Text style={styles.modalTitle}>Add Contact Manually</Text>
            
            <TextInput
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                style={styles.input}
            />

            <TextInput
                placeholder="Relationship (e.g., Father, Mother, Friend)"
                value={relation}
                onChangeText={setRelation}
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
            
            <Pressable 
                style={[
                    styles.saveButton, 
                    (!name.trim() || !phoneNumber.trim()) && styles.saveButtonDisabled
                ]} 
                onPress={handleSave}
                disabled={!name.trim() || !phoneNumber.trim()}
            >
                <Text style={[
                    styles.saveText,
                    (!name.trim() || !phoneNumber.trim()) && styles.saveTextDisabled
                ]}>
                    Save Contact
                </Text>
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
    saveButtonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.6,
    },
    saveText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    saveTextDisabled: {
        color: '#999',
    },
});
