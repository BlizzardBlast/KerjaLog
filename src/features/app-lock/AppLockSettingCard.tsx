import { StyleSheet, View } from 'react-native';
import { DecorativeView } from '@/design-system/components/DecorativeView';
import { Text } from '@/design-system/components/Text';
import { ToggleSwitch } from '@/design-system/components/ToggleSwitch';
import { AppIcon } from '@/design-system/icons/AppIcon';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { AppLockSettingFeedback } from '@/features/app-lock/AppLockSettingFeedback';
import { useAppLockSettingControl } from '@/features/app-lock/useAppLockSettingControl';
import { useI18n } from '@/i18n/I18nProvider';

export function AppLockSettingCard() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { enabled, error, isUpdating, updateEnabled } =
    useAppLockSettingControl();

  const handleValueChange = async (nextEnabled: boolean): Promise<void> => {
    await updateEnabled(nextEnabled);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        <DecorativeView
          style={[styles.icon, { backgroundColor: theme.colors.primarySoft }]}
        >
          <AppIcon
            name={{ ios: 'lock.shield.fill', android: 'shield_lock' }}
            size={22}
            color={theme.colors.primary}
          />
        </DecorativeView>

        <View style={styles.copy}>
          <Text variant="bodyStrong">{t('appLock.setting.title')}</Text>
          <Text variant="caption" color="textMuted">
            {t('appLock.setting.description')}
          </Text>
        </View>

        <ToggleSwitch
          accessibilityLabel={t('appLock.setting.title')}
          accessibilityHint={t('appLock.setting.description')}
          disabled={isUpdating}
          onValueChange={handleValueChange}
          value={enabled}
        />
      </View>

      <AppLockSettingFeedback enabled={enabled} error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[3],
    padding: spacing[4],
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
  },
  icon: {
    alignItems: 'center',
    borderRadius: radii.md,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  copy: {
    flex: 1,
    gap: spacing[1],
    minWidth: 0,
  },
});
