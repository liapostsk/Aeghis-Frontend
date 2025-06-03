import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import CountryPicker, {
  Country,
  CountryCode,
} from 'react-native-country-picker-modal';

type Props = {
  initialCountryCode?: CountryCode;
  onChange: (data: { countryCode: CountryCode; callingCode: string }) => void;
};

export default function PhoneNumberPicker({
  initialCountryCode = 'ES',
  onChange,
}: Props) {
  const [countryCode, setCountryCode] = useState<CountryCode>(initialCountryCode);
  const [callingCode, setCallingCode] = useState('34');
  const [visible, setVisible] = useState(false);

  const handleSelect = (country: Country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
    onChange({ countryCode: country.cca2, callingCode: country.callingCode[0] });
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.codeText}>+{callingCode}</Text>
        <View style={{ marginLeft: 6 }}>
          <CountryPicker
            countryCode={countryCode}
            withFlag
            withEmoji
            withFilter
            withAlphaFilter
            withCallingCode={false}
            withCallingCodeButton={false}
            onSelect={handleSelect}
            visible={visible} // el modal se muestra por separado
            onClose={() => setVisible(false)}
          />
        </View>
      </TouchableOpacity>
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
  codeText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
