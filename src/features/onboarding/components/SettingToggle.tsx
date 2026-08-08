import { StyleSheet, Switch, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { spacing } from '@/design-system/tokens/theme';

export type SettingToggleProps = {
  title: string;
  description: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void | Promise<void>;
};

export function SettingToggle({
  title,
  description,
  value,
  disabled = false,
  onValueChange,
}: SettingToggleProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.copy}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" color="textMuted" style={styles.description}>
          {description}
        </Text>
      </View>
      <Switch
        accessibilityHint={description}
        accessibilityLabel={title}
        disabled={disabled}
        ios_backgroundColor={theme.colors.surfaceMuted}
        onValueChange={onValueChange}
        thumbColor={theme.colors.surface}
        trackColor={{
          false: theme.colors.surfaceMuted,
          true: theme.colors.primary,
        }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing[4],
    minHeight: 82,
    padding: spacing[4],
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  description: {
    marginTop: 3,
  },
  disabled: {
    opacity: 0.6,
  },
});
