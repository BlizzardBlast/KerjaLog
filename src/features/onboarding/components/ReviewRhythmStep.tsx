import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { OptionCard } from '@/design-system/components/OptionCard';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { InfoCard } from '@/features/onboarding/components/InfoCard';
import {
  NotificationPermissionNotice,
  type NotificationReminderIssue,
} from '@/features/onboarding/components/NotificationPermissionNotice';
import { OptionSection } from '@/features/onboarding/components/OptionSection';
import { SettingToggle } from '@/features/onboarding/components/SettingToggle';
import { StepHeading } from '@/features/onboarding/components/StepHeading';
import type { OnboardingStepProps } from '@/features/onboarding/components/types';
import { reviewScheduleOptions } from '@/features/onboarding/options';
import { useI18n } from '@/i18n/I18nProvider';
import {
  disableWeeklyReflectionNotification,
  enableWeeklyReflectionNotification,
} from '@/platform/notifications/weeklyReflection';

export function ReviewRhythmStep({
  state,
  update,
  hasFinishError,
}: OnboardingStepProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [isUpdatingReminder, setIsUpdatingReminder] = useState(false);
  const [reminderIssue, setReminderIssue] =
    useState<NotificationReminderIssue | null>(null);

  const handleWeeklyReminderChange = async (enabled: boolean) => {
    setIsUpdatingReminder(true);

    try {
      if (!enabled) {
        await disableWeeklyReflectionNotification();
        update({ weeklyReminderEnabled: false });
        setReminderIssue(null);
        return;
      }

      const result = await enableWeeklyReflectionNotification({
        title: t('onboarding.review.notificationTitle'),
        body: t('onboarding.review.notificationBody'),
        channelName: t('onboarding.review.notificationChannelName'),
      });

      if (result !== 'enabled') {
        update({ weeklyReminderEnabled: false });
        setReminderIssue(
          result === 'permission-denied' ? 'permission' : 'runtime',
        );
        return;
      }

      update({ weeklyReminderEnabled: true });
      setReminderIssue(null);
    } catch {
      update({ weeklyReminderEnabled: false });
      setReminderIssue('setup');
    } finally {
      setIsUpdatingReminder(false);
    }
  };

  return (
    <View style={styles.content}>
      <StepHeading
        eyebrow={t('onboarding.review.eyebrow')}
        title={t('onboarding.review.title')}
        description={t('onboarding.review.description')}
      />

      <OptionSection title={t('onboarding.review.scheduleSection')}>
        {reviewScheduleOptions.map((option) => (
          <OptionCard
            key={option.value}
            title={t(option.titleKey)}
            description={t(option.descriptionKey)}
            icon={option.icon}
            selected={state.reviewSchedule === option.value}
            onPress={() => update({ reviewSchedule: option.value })}
          />
        ))}
      </OptionSection>

      <SettingToggle
        title={t('onboarding.review.weeklyReminderTitle')}
        description={t('onboarding.review.weeklyReminderDescription')}
        value={state.weeklyReminderEnabled}
        disabled={isUpdatingReminder}
        onValueChange={handleWeeklyReminderChange}
      />

      {reminderIssue ? (
        <NotificationPermissionNotice issue={reminderIssue} />
      ) : null}

      <SettingToggle
        title={t('onboarding.review.appLockTitle')}
        description={t('onboarding.review.appLockDescription')}
        value={state.appLockPreferred}
        onValueChange={(appLockPreferred) => update({ appLockPreferred })}
      />

      <InfoCard
        title={t('onboarding.review.privacyTitle')}
        body={t('onboarding.review.privacyDescription')}
      />

      {hasFinishError ? (
        <View
          accessibilityRole="alert"
          style={[
            styles.errorCard,
            {
              backgroundColor: theme.colors.dangerSoft,
              borderColor: theme.colors.danger,
            },
          ]}
        >
          <Text variant="caption" color="danger">
            {t('onboarding.review.saveError')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[6],
  },
  errorCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 14,
  },
});
