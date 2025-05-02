import React from 'react';
import { StyleSheet } from 'react-native';
import PhoneInput, {
  ICountry,
  isValidPhoneNumber,
} from 'react-native-international-phone-number';

type Props = {
  value: string;
  onChange: (phone: string, isValid: boolean) => void;
  selectedCountry: ICountry | null;
  onCountryChange: (country: ICountry) => void;
};

export default function PhoneNumberInput({
  value,
  onChange,
  selectedCountry,
  onCountryChange,
}: Props) {
  const handlePhoneChange = (phoneNumber: string) => {
    const valid = selectedCountry
      ? isValidPhoneNumber(phoneNumber, selectedCountry)
      : false;

    onChange(phoneNumber, valid);
  };

  return (
    <PhoneInput
      value={value}
      onChangePhoneNumber={handlePhoneChange}
      selectedCountry={selectedCountry}
      onChangeSelectedCountry={onCountryChange}
      placeholder="Enter phone number"
      defaultCountry="ES"
      phoneInputStyles={{
        container: styles.inputContainer,
      }}
    />
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#F3F3F3',
    borderRadius: 8,
    width: 375,
    alignSelf: 'center',
    marginTop: 20,
  },
});
