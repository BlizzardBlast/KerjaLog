import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';

type WorkAreaChipProps = {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
};

export function WorkAreaChip({
  label,
  selected,
  disabled,
  onPress,
}: Readonly<WorkAreaChipProps>) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected
            ? theme.colors.primarySoft
            : theme.colors.surface,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text
        color={selected ? 'primary' : 'textMuted'}
        numberOfLines={1}
        variant="label"
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    justifyContent: 'center',
    maxWidth: 220,
    minHeight: spacing[12],
    paddingHorizontal: spacing[4],
  },
  pressed: {
    opacity: 0.76,
  },
  disabled: {
    opacity: 0.55,
  },
});
