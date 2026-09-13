import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { formatLocalDate, isLocalCalendarDate } from '@/domain/review/period';

type ReviewDatePickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function ReviewDatePicker({
  label,
  value,
  onChange,
}: Readonly<ReviewDatePickerProps>) {
  const { theme } = useTheme();
  const date = parseLocalDate(value);
  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        mode: 'date',
        onChange: (_, selectedDate) => {
          if (selectedDate) {
            onChange(formatLocalDate(selectedDate));
          }
        },
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="label">{label}</Text>
      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={date}
          mode="date"
          display="compact"
          style={styles.iosPicker}
          onChange={(_, selectedDate) => {
            if (selectedDate) {
              onChange(formatLocalDate(selectedDate));
            }
          }}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={openPicker}
          style={({ pressed }) => [
            styles.androidControl,
            {
              backgroundColor: pressed
                ? theme.colors.primarySoft
                : theme.colors.surface,
              borderColor: theme.colors.controlBorder,
            },
          ]}
        >
          <Text>{value}</Text>
        </Pressable>
      )}
    </View>
  );
}

function parseLocalDate(value: string): Date {
  if (!isLocalCalendarDate(value)) {
    return new Date();
  }
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  return new Date(year, month - 1, day);
}

const styles = StyleSheet.create({
  container: { gap: spacing[2] },
  androidControl: {
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing[3],
  },
  iosPicker: { minHeight: 52 },
});
