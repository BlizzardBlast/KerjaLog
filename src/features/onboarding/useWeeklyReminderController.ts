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
  Extract<
    WeeklyReflectionEnableResult,
    'permission-denied' | 'unsupported-runtime'
  >,
  NotificationReminderIssue
> = {
  'permission-denied': 'permission',
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

  const applyEnableResult = (result: WeeklyReflectionEnableResult) => {
    if (result === 'enabled-exact') {
      update({
        weeklyReminderEnabled: true,
        weeklyReminderPrecision: 'exact',
      });
      dispatchFeedback({ type: 'success' });
      return;
    }

    if (result === 'enabled-inexact') {
      update({
        weeklyReminderEnabled: true,
        weeklyReminderPrecision: 'inexact',
      });
      dispatchFeedback({ type: 'notice', issue: 'inexact-alarm' });
      return;
    }

    update({
      weeklyReminderEnabled: false,
      weeklyReminderPrecision: null,
    });
    dispatchFeedback({
      type: 'failure',
      issue: reminderIssueByResult[result],
    });
  };

  const setEnabled = async (enabled: boolean) => {
    dispatchFeedback({ type: 'start' });

    try {
      if (!enabled) {
        await disableWeeklyReflectionNotification();
        update({
          weeklyReminderEnabled: false,
          weeklyReminderPrecision: null,
        });
        dispatchFeedback({ type: 'success' });
        return;
      }

      const result = await enableForSchedule(state.weeklyReminderSchedule);
      applyEnableResult(result);
    } catch {
      update({
        weeklyReminderEnabled: false,
        weeklyReminderPrecision: null,
      });
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
      applyEnableResult(result);
    } catch {
      update({
        weeklyReminderEnabled: false,
        weeklyReminderPrecision: null,
      });
      dispatchFeedback({ type: 'failure', issue: 'setup' });
    }
  };

  return {
    feedback,
    setEnabled,
    setSchedule,
  };
}
