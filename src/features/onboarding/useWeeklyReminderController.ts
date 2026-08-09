import { useReducer } from 'react';
import type {
  OnboardingPatch,
  OnboardingState,
  WeeklyReminderSchedule,
} from '@/features/onboarding/model';
import {
  INITIAL_REMINDER_FEEDBACK_STATE,
  type NotificationReminderIssue,
  reminderFeedbackReducer,
} from '@/features/onboarding/reminderFeedback';
import { useI18n } from '@/i18n/I18nProvider';
import {
  disableWeeklyReflectionNotification,
  enableWeeklyReflectionNotification,
  type WeeklyReflectionEnableResult,
} from '@/platform/notifications/weeklyReflection';

const reminderIssueByResult: Record<
  Exclude<WeeklyReflectionEnableResult, 'enabled'>,
  NotificationReminderIssue
> = {
  'permission-denied': 'permission',
  'exact-alarm-permission-required': 'exact-alarm',
  'unsupported-runtime': 'runtime',
};

type UpdateOnboarding = (patch: OnboardingPatch) => void;

export function useWeeklyReminderController(
  state: OnboardingState,
  update: UpdateOnboarding,
) {
  const { t } = useI18n();
  const [feedback, dispatchFeedback] = useReducer(
    reminderFeedbackReducer,
    INITIAL_REMINDER_FEEDBACK_STATE,
  );

  const enableForSchedule = async (schedule: WeeklyReminderSchedule) =>
    enableWeeklyReflectionNotification({
      schedule,
      copy: {
        title: t('onboarding.review.notificationTitle'),
        body: t('onboarding.review.notificationBody'),
        channelName: t('onboarding.review.notificationChannelName'),
      },
    });

  const setEnabled = async (enabled: boolean) => {
    dispatchFeedback({ type: 'start' });

    try {
      if (!enabled) {
        await disableWeeklyReflectionNotification();
        update({ weeklyReminderEnabled: false });
        dispatchFeedback({ type: 'success' });
        return;
      }

      const result = await enableForSchedule(state.weeklyReminderSchedule);

      if (result !== 'enabled') {
        update({ weeklyReminderEnabled: false });
        dispatchFeedback({
          type: 'failure',
          issue: reminderIssueByResult[result],
        });
        return;
      }

      update({ weeklyReminderEnabled: true });
      dispatchFeedback({ type: 'success' });
    } catch {
      update({ weeklyReminderEnabled: false });
      dispatchFeedback({ type: 'failure', issue: 'setup' });
    }
  };

  const setSchedule = async (schedule: WeeklyReminderSchedule) => {
    update({ weeklyReminderSchedule: schedule });

    if (!state.weeklyReminderEnabled) {
      return;
    }

    dispatchFeedback({ type: 'start' });

    try {
      const result = await enableForSchedule(schedule);

      if (result !== 'enabled') {
        update({ weeklyReminderEnabled: false });
        dispatchFeedback({
          type: 'failure',
          issue: reminderIssueByResult[result],
        });
        return;
      }

      dispatchFeedback({ type: 'success' });
    } catch {
      update({ weeklyReminderEnabled: false });
      dispatchFeedback({ type: 'failure', issue: 'setup' });
    }
  };

  return {
    feedback,
    setEnabled,
    setSchedule,
  };
}
