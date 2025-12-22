import {
    Text,
    View,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    Pressable,
    Alert
  } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from '@expo/vector-icons/Ionicons';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { router } from "expo-router";
import { useUserStore } from "../../../lib/storage/useUserStorage";
import { useTranslation } from 'react-i18next';

const MINIMUM_AGE = 18;
const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
}

export default function AgeScreen() {

    // Estados
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isValidAge, setIsValidAge] = useState<boolean>(true);
    const [dateOfBirth, setDateOfBirth] = useState("");
    const { user, setUser } = useUserStore();
    const { t } = useTranslation();

    // Handlers para el DatePicker
    const showDatePicker = () => setDatePickerVisibility(true);
    const hideDatePicker = () => setDatePickerVisibility(false);

    // Valores comp
    const canContinue = dateOfBirth.trim() !== "" && isValidAge;

    // Event handlers para manejo de fecha

    const handleDateBirthChange = (date: Date) => {
        setUser({ ...user, dateOfBirth: date });
    };

    const handleConfirm = (date: Date) => {
        setSelectedDate(date);
        
        const validation = validateAge(date);
        
        // Validate age before accepting the date
        if (!validation.isValid) {
            // Show alert for underage users
            if (validation.isUnder18) {
                Alert.alert(
                    t('register.age.alerts.ageRestriction.title'),
                    t('register.age.alerts.ageRestriction.message'),
                    [{ text: "OK", onPress: () => console.log("Age restriction alert closed") }],
                    { cancelable: false }
                );
                setIsValidAge(false);
            } 
            // Show alert for invalid date
            else {
                Alert.alert(
                    t('register.age.alerts.invalidDate.title'),
                    t('register.age.alerts.invalidDate.message'),
                    [{ text: "OK", onPress: () => console.log("Invalid date alert closed") }],
                    { cancelable: false }
                );
                setIsValidAge(false);
            }
            // Still set the date to show the user's selection
            setDateOfBirth(formatDate(date));
        } 
        // Valid date
        else {
            handleDateBirthChange(date);
            setDateOfBirth(formatDate(date));
            setIsValidAge(true);
        }
        hideDatePicker();
    };

    // Consolidated age validation function
    const validateAge = (date: Date) => {
        const today = new Date();
        let age = today.getFullYear() - date.getFullYear();
        const hasHadBirthdayThisYear =
          today.getMonth() > date.getMonth() ||
          (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());
      
        if (!hasHadBirthdayThisYear) {
          age--;
        }
        
        return {
            age,
            isValid: age >= MINIMUM_AGE,
            isUnder18: age < MINIMUM_AGE
        };
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', DATE_FORMAT_OPTIONS);
    };

    return (
        <SafeAreaView style={styles.container}>

            <Text style={styles.textTitle}>{t('register.age.title')}</Text>

            <View style={styles.inputContainer}>
                <TouchableOpacity onPress={showDatePicker} style={styles.inputWrapper}>
                <TextInput
                    style={styles.textInput}
                    placeholder={t('register.age.placeholder')}
                    value={dateOfBirth}
                    placeholderTextColor="#11182766"
                    editable={false}
                    selectTextOnFocus={false}
                />
                <Icon name="calendar-outline" size={24} color="#333" style={styles.icon} />
                </TouchableOpacity>
            </View>

            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                date={selectedDate}
                maximumDate={new Date()}
                onConfirm={handleConfirm}
                onCancel={hideDatePicker}
            />

            <Image
                source={require("../../../assets/images/curiosity.png")}
                style={styles.image}
            />

            {(canContinue) ? (
            <Pressable 
                style={styles.continueButton} 
                onPress={() => {
                    router.push("/(auth)/register/name");
                }}
            >
                <Text style={styles.continueButtonText}>{t('register.age.button')}</Text>
            </Pressable>
            ) : (
            <Pressable style={[styles.continueButton, styles.disabledButton]} onPress={() => handleConfirm(selectedDate)}>
                <Text style={styles.continueButtonText}>{t('register.age.button')}</Text>
            </Pressable>
            )}

        </SafeAreaView>
    );
}

// Reference for the image used in the app:
// <a href="https://storyset.com/people">People illustrations by Storyset</a>

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "flex-start",
        alignItems: 'center',
        backgroundColor: '#7A33CC',
        padding: 20,
    },
    textTitle: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: '15%',
        marginBottom: 30,
    },
    inputContainer: {
        width: '100%',
        marginTop: 20,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        height: 50,
        paddingHorizontal: 15,
        marginVertical: 10,
    },
    textInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#000',
    },
    icon: {
        marginLeft: 10,
    },
    continueButton: {
        width: '80%',
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
        position: 'absolute',
        bottom: 50,
    },
    disabledButton: {
        opacity: 0.5,
    },
    image: {
        width: 300,
        height: 300,
        position: "absolute",
        top: "52%",
        },
    continueButtonText: {
        color: '#7A33CC',
        fontSize: 18,
        fontWeight: 'bold',
    }
});
  