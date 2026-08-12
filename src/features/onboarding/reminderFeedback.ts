export type NotificationReminderIssue = 'permission' | 'runtime' | 'setup';

export type ReminderFeedbackState = {
  issue: NotificationReminderIssue | null;
  isUpdating: boolean;
};

export type ReminderFeedbackAction =
  | { type: 'start' }
  | { type: 'success' }
  | { type: 'failure'; issue: NotificationReminderIssue };

export const INITIAL_REMINDER_FEEDBACK_STATE: ReminderFeedbackState = {
  issue: null,
  isUpdating: false,
};

export function reminderFeedbackReducer(
  state: ReminderFeedbackState,
  action: ReminderFeedbackAction,
): ReminderFeedbackState {
  switch (action.type) {
    case 'start':
      return {
        ...state,
        isUpdating: true,
      };
    case 'success':
      return {
        issue: null,
        isUpdating: false,
      };
    case 'failure':
      return {
        issue: action.issue,
        isUpdating: false,
      };
  }
}
