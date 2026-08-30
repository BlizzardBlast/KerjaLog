export const getPermissionsAsync = jest.fn();
export const requestPermissionsAsync = jest.fn();
export const getAllScheduledNotificationsAsync = jest.fn();
export const setNotificationChannelAsync = jest.fn();
export const cancelScheduledNotificationAsync = jest.fn();
export const scheduleNotificationAsync = jest.fn();
export const setNotificationHandler = jest.fn();
export const getLastNotificationResponse = jest.fn(() => null);
export const clearLastNotificationResponse = jest.fn();
export const addNotificationResponseReceivedListener = jest.fn(() => ({
  remove: jest.fn(),
}));

export const DEFAULT_ACTION_IDENTIFIER =
  'expo.modules.notifications.actions.DEFAULT';

export const AndroidImportance = {
  DEFAULT: 3,
} as const;

export const IosAuthorizationStatus = {
  PROVISIONAL: 3,
} as const;

export const SchedulableTriggerInputTypes = {
  WEEKLY: 'weekly',
} as const;
