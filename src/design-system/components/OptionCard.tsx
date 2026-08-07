import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';

export type OptionCardProps = {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

export function OptionCard({
  title,
  description,
  selected,
  onPress,
  disabled = false,
}: OptionCardProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: selected
            ? theme.colors.primarySoft
            : theme.colors.surface,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
        selected && styles.selected,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View
        accessibilityElementsHidden
        style={[
          styles.indicator,
          {
            backgroundColor: selected
              ? theme.colors.primary
              : theme.colors.surfaceSubtle,
            borderColor: selected ? theme.colors.primary : theme.colors.border,
          },
        ]}
      >
        {selected ? (
          <Text variant="label" color="onPrimary">
            ✓
          </Text>
        ) : null}
      </View>
      <View style={styles.copy}>
        <Text variant="bodyStrong">{title}</Text>
        {description ? (
          <Text variant="caption" color="textMuted" style={styles.description}>
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 68,
    padding: 14,
  },
  selected: {
    borderWidth: 2,
    padding: 13,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.5,
  },
  indicator: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  description: {
    marginTop: 3,
  },
});
