import { StyleSheet, View } from 'react-native';
import { spacing } from '@/design-system/tokens/theme';
import { AppLockSettingFeedback } from '@/features/app-lock/AppLockSettingFeedback';
import { useAppLockSettingControl } from '@/features/app-lock/useAppLockSettingControl';
import { SettingToggle } from '@/features/onboarding/components/SettingToggle';
import { useI18n } from '@/i18n/I18nProvider';

export function OnboardingAppLockSetting() {
  const { t } = useI18n();
  const { enabled, error, isUpdating, updateEnabled } =
    useAppLockSettingControl();

  const handleValueChange = async (nextEnabled: boolean) => {
    await updateEnabled(nextEnabled);
  };

  return (
    <View style={styles.container}>
      <SettingToggle
        title={t('appLock.setting.title')}
        description={t('appLock.setting.description')}
        value={enabled}
        disabled={isUpdating}
        onValueChange={handleValueChange}
      />
      <AppLockSettingFeedback enabled={enabled} error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
});
