import { Text } from '@/design-system/components/Text';
import type { AppLockError } from '@/features/app-lock/model';
import { useI18n } from '@/i18n/I18nProvider';

type AppLockSettingFeedbackProps = {
  enabled: boolean;
  error: AppLockError | null;
};

export function AppLockSettingFeedback({
  enabled,
  error,
}: AppLockSettingFeedbackProps) {
  const { t } = useI18n();
  const message =
    error === 'unavailable'
      ? t('appLock.setting.unavailable')
      : error
        ? t('appLock.setting.failed')
        : enabled
          ? t('appLock.setting.enabled')
          : t('appLock.setting.disabled');

  return (
    <Text
      role={error ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
      variant="caption"
      color={error ? 'danger' : 'textMuted'}
    >
      {message}
    </Text>
  );
}
