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
}: Readonly<AppLockSettingFeedbackProps>) {
  const { t } = useI18n();
  let message = t(
    enabled ? 'appLock.setting.enabled' : 'appLock.setting.disabled',
  );
  if (error === 'unavailable') {
    message = t('appLock.setting.unavailable');
  } else if (error) {
    message = t('appLock.setting.failed');
  }

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
