import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import { InexactReminderNotice } from '@/features/reminder/InexactReminderNotice';
import { openExactAlarmPermissionSettings } from '@/platform/notifications/exactAlarmAccess';

jest.mock('@/platform/notifications/exactAlarmAccess', () => ({
  openExactAlarmPermissionSettings: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/i18n/I18nProvider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

const openExactAlarmPermissionSettingsMock = jest.mocked(
  openExactAlarmPermissionSettings,
);

describe('InexactReminderNotice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('tells the user that reminder delivery is approximate', async () => {
    await render(
      <ThemeProvider>
        <InexactReminderNotice />
      </ThemeProvider>,
    );

    expect(screen.getByText('reminder.inexact.title')).toBeTruthy();
    expect(screen.getByText('reminder.inexact.description')).toBeTruthy();
    expect(screen.getByText('reminder.inexact.useExact')).toBeTruthy();
  });

  test('offers the app-specific exact alarm settings action', async () => {
    await render(
      <ThemeProvider>
        <InexactReminderNotice />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByText('reminder.inexact.useExact'));

    expect(openExactAlarmPermissionSettingsMock).toHaveBeenCalledTimes(1);
  });
});
