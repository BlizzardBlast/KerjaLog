import { StyleSheet, Switch, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';

export type SettingToggleProps = {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function SettingToggle({
  title,
  description,
  value,
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
    gap: 16,
    minHeight: 82,
    padding: 16,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  description: {
    marginTop: 3,
  },
});
