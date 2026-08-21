import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { AppIcon } from '@/design-system/icons/AppIcon';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import type { LanguageOption } from '@/i18n/components/languageSelectorOptions';

type LanguageSelectorTriggerProps = {
  option: LanguageOption;
  accessibilityLabel: string;
  accessibilityValue: string;
  expanded: boolean;
  onPress: () => void;
};

export function LanguageSelectorTrigger({
  option,
  accessibilityLabel,
  accessibilityValue,
  expanded,
  onPress,
}: LanguageSelectorTriggerProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityValue={{ text: accessibilityValue }}
      hitSlop={spacing[1]}
      onPress={onPress}
      style={({ pressed }) => [
        styles.trigger,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <Text variant="body">{option.flag}</Text>
      <Text variant="label">{option.shortLabel}</Text>
      <AppIcon
        name={{ ios: 'chevron.down', android: 'keyboard_arrow_down' }}
        size={16}
        color={theme.colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing[1],
    justifyContent: 'center',
    minHeight: spacing[12],
    minWidth: 82,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  pressed: {
    opacity: 0.72,
  },
});
