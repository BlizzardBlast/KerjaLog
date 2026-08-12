import { StyleSheet, View } from 'react-native';
import { spacing } from '@/design-system/tokens/theme';
import { AppLockSettingFeedback } from '@/features/app-lock/AppLockSettingFeedback';
import { useAppLockSettingControl } from '@/features/app-lock/useAppLockSettingControl';
import { SettingToggle } from '@/features/onboarding/components/SettingToggle';
import { useI18n } from '@/i18n/I18nProvider';

type OnboardingAppLockSettingProps = {
  onPreferenceChange: (preferred: boolean) => void;
};

export function OnboardingAppLockSetting({
  onPreferenceChange,
}: OnboardingAppLockSettingProps) {
  const { t } = useI18n();
  const { enabled, error, isUpdating, updateEnabled } =
    useAppLockSettingControl();

  const handleValueChange = async (nextEnabled: boolean) => {
    const didChange = await updateEnabled(nextEnabled);

    if (didChange) {
      onPreferenceChange(nextEnabled);
    }
  };

  return (
    <View style={styles.container}>
      <SettingToggle
        title={t('onboarding.review.appLockTitle')}
        description={t('onboarding.review.appLockDescription')}
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
