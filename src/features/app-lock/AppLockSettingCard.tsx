import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { DecorativeView } from '@/design-system/components/DecorativeView';
import { Text } from '@/design-system/components/Text';
import { ToggleSwitch } from '@/design-system/components/ToggleSwitch';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { useAppLock } from '@/features/app-lock/AppLockProvider';
import { useI18n } from '@/i18n/I18nProvider';

export function AppLockSettingCard() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { enabled, error, isAuthenticating, setEnabled, clearError } =
    useAppLock();
  const [changing, setChanging] = useState(false);

  const updateEnabled = async (nextEnabled: boolean) => {
    setChanging(true);
    clearError();

    try {
      await setEnabled(nextEnabled);
    } finally {
      setChanging(false);
    }
  };

  const message =
    error === 'unavailable'
      ? t('appLock.setting.unavailable')
      : error
        ? t('appLock.setting.failed')
        : enabled
          ? t('appLock.setting.enabled')
          : t('appLock.setting.disabled');

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
          style={[
            styles.icon,
            { backgroundColor: theme.colors.primarySoft },
          ]}
        >
          <SymbolView
            name={{ ios: 'lock.shield.fill', android: 'shield_lock', web: 'lock' }}
            size={22}
            tintColor={theme.colors.primary}
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
          disabled={changing || isAuthenticating}
          onValueChange={updateEnabled}
          value={enabled}
        />
      </View>

      <Text
        accessibilityLiveRegion="polite"
        variant="caption"
        color={error ? 'danger' : 'textMuted'}
      >
        {message}
      </Text>
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
