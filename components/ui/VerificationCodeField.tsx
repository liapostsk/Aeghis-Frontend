import { StyleSheet, Text } from 'react-native';
import { CodeField, Cursor, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';

type Props = {
  value: string;
  setValue: (val: string) => void;
  cellCount?: number;
};

export default function VerificationCodeField({ value, setValue, cellCount = 6 }: Props) {
  const ref = useBlurOnFulfill({ value, cellCount });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue,
  });

  return (
    <CodeField
      ref={ref}
      {...props}
      value={value}
      onChangeText={setValue}
      cellCount={cellCount}
      rootStyle={styles.codeFieldRoot}
      keyboardType="number-pad"
      textContentType="oneTimeCode"
      renderCell={({ index, symbol, isFocused }) => (
        <Text
          key={index}
          style={[styles.cell, isFocused && styles.focusCell]}
          onLayout={getCellOnLayoutHandler(index)}
        >
          {symbol || (isFocused ? <Cursor /> : null)}
        </Text>
      )}
    />
  );
}

const styles = StyleSheet.create({
  codeFieldRoot: {
    marginTop: 20,
    width: 300,
    justifyContent: 'space-between',
  },
  cell: {
    width: 40,
    height: 50,
    lineHeight: 50,
    fontSize: 24,
    borderWidth: 2,
    borderColor: '#fff',
    textAlign: 'center',
    color: '#fff',
    borderRadius: 8,
  },
  focusCell: {
    borderColor: '#7A33CC',
  },
});
