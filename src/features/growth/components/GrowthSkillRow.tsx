import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';

export type GrowthSkillRowProps = {
  name: string;
  description: string;
  symbol: string;
  countLabel: string;
  disabled: boolean;
  onPress: () => void;
};

export function GrowthSkillRow({
  name,
  description,
  symbol,
  countLabel,
  disabled,
  onPress,
}: GrowthSkillRowProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}. ${description}. ${countLabel}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && !disabled && { backgroundColor: theme.colors.primarySoft },
      ]}
    >
      <View
        accessible={false}
        style={[
          styles.symbol,
          {
            backgroundColor: disabled
              ? theme.colors.surfaceSubtle
              : theme.colors.primarySoft,
          },
        ]}
      >
        <Text
          importantForAccessibility="no"
          accessibilityElementsHidden
          color={disabled ? 'textMuted' : 'primary'}
          variant="bodyStrong"
        >
          {symbol}
        </Text>
      </View>
      <View style={styles.copy}>
        <Text variant="label">{name}</Text>
        <Text variant="caption" color="textMuted">
          {description}
        </Text>
      </View>
      <Text
        variant="caption"
        color={disabled ? 'textMuted' : 'primary'}
        style={styles.count}
      >
        {countLabel}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing[3],
    minHeight: 72,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  symbol: {
    alignItems: 'center',
    borderRadius: radii.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  count: {
    flexShrink: 0,
    textAlign: 'right',
  },
});
