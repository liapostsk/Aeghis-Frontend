// components/shared/PhoneNumberPicker.tsx
import React from 'react';
import PhoneNumberInput, { ICountry } from 'react-native-international-phone-number';

type Props = {
  value: string;
  onChange: (phone: string, isValid: boolean) => void;
  selectedCountry: ICountry | null;
  onCountryChange: (country: ICountry) => void;
};

export default function PhoneNumberPicker({
  value,
  onChange,
  selectedCountry,
  onCountryChange,
}: Props) {
  return (
    <PhoneNumberInput
      value={value}
      onChange={onChange}
      selectedCountry={selectedCountry}
      onCountryChange={onCountryChange}
      defaultCountry="ES"
      containerStyle={{ marginBottom: 20 }}
    />
  );
}
