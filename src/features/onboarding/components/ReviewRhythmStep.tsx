import { StyleSheet, View } from 'react-native';
import { OptionCard } from '@/design-system/components/OptionCard';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { InfoCard } from '@/features/onboarding/components/InfoCard';
import { NotificationPermissionNotice } from '@/features/onboarding/components/NotificationPermissionNotice';
import { OnboardingAppLockSetting } from '@/features/onboarding/components/OnboardingAppLockSetting';
import { OptionSection } from '@/features/onboarding/components/OptionSection';
import { ReminderScheduleCard } from '@/features/onboarding/components/ReminderScheduleCard';
import { SettingToggle } from '@/features/onboarding/components/SettingToggle';
import { StepHeading } from '@/features/onboarding/components/StepHeading';
import type { OnboardingStepProps } from '@/features/onboarding/components/types';
import { reviewScheduleOptions } from '@/features/onboarding/options';
import { useWeeklyReminderController } from '@/features/onboarding/useWeeklyReminderController';
import { useI18n } from '@/i18n/I18nProvider';

export function ReviewRhythmStep({
  state,
  update,
  hasFinishError,
}: OnboardingStepProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const reminder = useWeeklyReminderController(state, update);

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

      <View style={styles.reminderSection}>
        <SettingToggle
          title={t('onboarding.review.weeklyReminderTitle')}
          description={t('onboarding.review.reminderDescription')}
          value={state.weeklyReminderEnabled}
          disabled={reminder.feedback.isUpdating}
          onValueChange={reminder.setEnabled}
        />

        <ReminderScheduleCard
          schedule={state.weeklyReminderSchedule}
          disabled={reminder.feedback.isUpdating}
          onChange={reminder.setSchedule}
        />

        {reminder.feedback.issue ? (
          <NotificationPermissionNotice issue={reminder.feedback.issue} />
        ) : null}
      </View>

      <OnboardingAppLockSetting
        preferred={state.appLockPreferred}
        onPreferenceChange={(appLockPreferred) => update({ appLockPreferred })}
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
  reminderSection: {
    gap: spacing[3],
  },
  errorCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 14,
  },
});
