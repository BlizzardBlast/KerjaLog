import {
  INITIAL_REMINDER_FEEDBACK_STATE,
  reminderFeedbackReducer,
} from '@/features/onboarding/reminderFeedback';

describe('reminder feedback state', () => {
  test('preserves an existing warning while a retry is pending', () => {
    const failedState = reminderFeedbackReducer(
      INITIAL_REMINDER_FEEDBACK_STATE,
      { type: 'failure', issue: 'permission' },
    );

    expect(reminderFeedbackReducer(failedState, { type: 'start' })).toEqual({
      issue: 'permission',
      isUpdating: true,
    });
  });

  test('clears the warning only after a successful attempt', () => {
    const failedState = {
      issue: 'setup' as const,
      isUpdating: false,
    };

    expect(reminderFeedbackReducer(failedState, { type: 'success' })).toEqual(
      INITIAL_REMINDER_FEEDBACK_STATE,
    );
  });

  test('replaces the warning when a retry fails for a different reason', () => {
    const failedState = {
      issue: 'setup' as const,
      isUpdating: false,
    };

    expect(
      reminderFeedbackReducer(failedState, {
        type: 'failure',
        issue: 'permission',
      }),
    ).toEqual({
      issue: 'permission',
      isUpdating: false,
    });
  });

  test('tracks exact alarm access separately from notification permission', () => {
    expect(
      reminderFeedbackReducer(INITIAL_REMINDER_FEEDBACK_STATE, {
        type: 'failure',
        issue: 'exact-alarm',
      }),
    ).toEqual({
      issue: 'exact-alarm',
      isUpdating: false,
    });
  });
});
