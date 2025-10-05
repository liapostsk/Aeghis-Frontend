import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import CountrySelect from 'react-native-country-select';

type Props = {
  initialCountryCode?: string;
  onChange: (data: { countryCode: string; callingCode: string }) => void;
};

export default function PhoneNumberPicker({
  initialCountryCode = 'ES',
  onChange,
}: Props) {
  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [callingCode, setCallingCode] = useState('34');
  const [visible, setVisible] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<any[]>([]);

  const handleSelect = (country: any) => {
    if (country) {
      setCountryCode(country.code || country.cca2);
      setCallingCode(country.idd.root || country.callingCode);
      setSelectedCountries([country]);
      onChange({ 
        countryCode: country.code || country.cca2, 
        callingCode: country.idd.root || country.callingCode 
      });
    }
    setVisible(false);
  };

  const handleClose = () => {
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.flag}>
          {selectedCountries.length > 0 ? selectedCountries[0].flag : '🇪🇸'}
        </Text>
        <Text style={styles.codeText}>{callingCode}</Text>
      </TouchableOpacity>

      <CountrySelect
        isMultiSelect={false}
        visible={visible}
        onSelect={handleSelect}
        onClose={handleClose}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#E3D5F5',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 13 : 12,
    alignItems: 'center',
  },
  flag: {
    fontSize: 20,
    marginRight: 8,
  },
  codeText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
