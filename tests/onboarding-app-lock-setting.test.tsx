import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import { useAppLockSettingControl } from '@/features/app-lock/useAppLockSettingControl';
import { OnboardingAppLockSetting } from '@/features/onboarding/components/OnboardingAppLockSetting';

jest.mock('@/features/app-lock/useAppLockSettingControl', () => ({
  useAppLockSettingControl: jest.fn(),
}));

jest.mock('@/i18n/I18nProvider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

const useAppLockSettingControlMock = jest.mocked(useAppLockSettingControl);

describe('OnboardingAppLockSetting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows device-credential setup guidance when App Lock is unavailable', async () => {
    useAppLockSettingControlMock.mockReturnValue({
      enabled: false,
      error: 'unavailable',
      isUpdating: false,
      updateEnabled: jest.fn(),
    });

    await render(
      <ThemeProvider>
        <OnboardingAppLockSetting />
      </ThemeProvider>,
    );

    expect(screen.getByText('appLock.setting.unavailable')).toBeTruthy();
  });

  test('changes the real App Lock setting instead of an onboarding copy', async () => {
    const updateEnabled = jest.fn().mockResolvedValue(true);
    useAppLockSettingControlMock.mockReturnValue({
      enabled: false,
      error: null,
      isUpdating: false,
      updateEnabled,
    });

    await render(
      <ThemeProvider>
        <OnboardingAppLockSetting />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('switch'));

    await waitFor(() => expect(updateEnabled).toHaveBeenCalledWith(true));
  });

  test('leaves the control off when the real App Lock change fails', async () => {
    const updateEnabled = jest.fn().mockResolvedValue(false);
    useAppLockSettingControlMock.mockReturnValue({
      enabled: false,
      error: 'unavailable',
      isUpdating: false,
      updateEnabled,
    });

    await render(
      <ThemeProvider>
        <OnboardingAppLockSetting />
      </ThemeProvider>,
    );

    await fireEvent.press(screen.getByRole('switch'));

    await waitFor(() => expect(updateEnabled).toHaveBeenCalledWith(true));
    expect(screen.getByRole('switch').props.value).toBe(false);
  });
});
