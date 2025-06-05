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
import { useUserStore } from "../../lib/storage/useUserStorage";

export default function AgeScreen() {
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isValidAge, setIsValidAge] = useState<boolean>(true);
    const [dateOfBirth, setDateOfBirth] = useState("");
    const { user, setUser } = useUserStore();


    const showDatePicker = () => setDatePickerVisibility(true);
    const hideDatePicker = () => setDatePickerVisibility(false);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const handleDateBirthChange = (date: Date) => {
        setUser({ ...user, dateOfBirth: date });
    };

    const handleConfirm = (date: Date) => {
        setSelectedDate(date);
        
        // Validate age before accepting the date
        if (!isDateValid(date)) {
            // Show alert for underage users
            if (isUnder18(date)) {
                Alert.alert(
                    "Age Restriction",
                    "You must be at least 18 years old to create an account.",
                    [{ text: "OK", onPress: () => console.log("Age restriction alert closed") }],
                    { cancelable: false }
                );
                setIsValidAge(false);
            } 
            // Show alert for invalid date
            else {
                Alert.alert(
                    "Invalid Date",
                    "Please select a valid date of birth.",
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

    const obtainAge = (date: Date): number => {
        const today = new Date();
        let age = today.getFullYear() - date.getFullYear();
        const hasHadBirthdayThisYear =
          today.getMonth() > date.getMonth() ||
          (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());
      
        if (!hasHadBirthdayThisYear) {
          age--;
        }
        return age;
    };
    
    // Check if the date is valid and the user is 18 or older
    // If the user is under 18, show an alert
    const isDateValid = (date: Date): boolean => obtainAge(date) >= 18;
    
    // Check if the user is under 18
    const isUnder18 = (date: Date): boolean => {
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        const monthDiff = today.getMonth() - date.getMonth();
        const dayDiff = today.getDate() - date.getDate();
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            return age - 1 < 18;
        }
        return age < 18;
    };

    return (
        <SafeAreaView style={styles.container}>

            <Text style={styles.textTitle}>Before starting we have to know your Age</Text>

            <View style={styles.inputContainer}>
                <TouchableOpacity onPress={showDatePicker} style={styles.inputWrapper}>
                <TextInput
                    style={styles.textInput}
                    placeholder="Select your date of birth"
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
                source={require("../../assets/images/curiosity.png")}
                style={styles.image}
            />

            {(dateOfBirth.trim() !== "" && isValidAge) ? (
            <Pressable 
                style={styles.continueButton} 
                onPress={() => {
                    router.push("/(onboarding)/name");
                }}
            >
                <Text style={styles.continueButtonText}>Continue</Text>
            </Pressable>
            ) : (
            <Pressable style={[styles.continueButton, styles.disabledButton]} onPress={() => handleConfirm(selectedDate)}>
                <Text style={styles.continueButtonText}>Continue</Text>
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
    selectedDateContainer: {
        marginTop: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 10,
        borderRadius: 8,
    },
    selectedDateText: {
        color: '#FFFFFF',
        fontSize: 16,
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
  