import { Pressable, StyleSheet, View } from 'react-native';
import { DecorativeView } from '@/design-system/components/DecorativeView';
import { Text } from '@/design-system/components/Text';
import { AppIcon } from '@/design-system/icons/AppIcon';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import type { GrowthSkillIcon } from '@/features/growth/growthPresentation';

export type GrowthSkillRowProps = {
  name: string;
  description: string;
  icon: GrowthSkillIcon;
  countLabel: string;
  disabled: boolean;
  onPress: () => void;
};

export function GrowthSkillRow({
  name,
  description,
  icon,
  countLabel,
  disabled,
  onPress,
}: Readonly<GrowthSkillRowProps>) {
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
      <DecorativeView
        style={[
          styles.icon,
          {
            backgroundColor: disabled
              ? theme.colors.surfaceSubtle
              : theme.colors.primarySoft,
          },
        ]}
      >
        <AppIcon
          name={icon}
          size={20}
          color={disabled ? theme.colors.textMuted : theme.colors.primary}
        />
      </DecorativeView>
      <View style={styles.copy}>
        <Text variant="bodyStrong">{name}</Text>
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
  icon: {
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
