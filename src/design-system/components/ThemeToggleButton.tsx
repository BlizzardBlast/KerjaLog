import { Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/design-system/icons/AppIcon';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { useI18n } from '@/i18n/I18nProvider';

export function ThemeToggleButton() {
  const { theme, resolvedTheme, setMode } = useTheme();
  const { t } = useI18n();
  const switchingToDark = resolvedTheme === 'light';

  return (
    <Pressable
      accessibilityLabel={t(
        switchingToDark
          ? 'common.theme.switchToDark'
          : 'common.theme.switchToLight',
      )}
      accessibilityRole="button"
      hitSlop={spacing[1]}
      onPress={() => setMode(switchingToDark ? 'dark' : 'light')}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <AppIcon
        name={
          switchingToDark
            ? { ios: 'moon.fill', android: 'dark_mode' }
            : { ios: 'sun.max.fill', android: 'light_mode' }
        }
        size={20}
        color={theme.colors.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    height: spacing[12],
    justifyContent: 'center',
    width: spacing[12],
  },
  pressed: {
    opacity: 0.72,
  },
});
