import { act, render, screen } from '@testing-library/react-native';
import { type ReactNode, useState } from 'react';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import { ReviewRhythmStep } from '@/features/onboarding/components/ReviewRhythmStep';
import {
  DEFAULT_ONBOARDING_STATE,
  type OnboardingPatch,
  type OnboardingState,
} from '@/features/onboarding/model';
import { I18nProvider } from '@/i18n/I18nProvider';
import { enableWeeklyReflectionNotification } from '@/platform/notifications/weeklyReflection';

jest.mock('@/platform/notifications/weeklyReflection', () => ({
  disableWeeklyReflectionNotification: jest.fn().mockResolvedValue(undefined),
  enableWeeklyReflectionNotification: jest.fn(),
}));

const enableWeeklyReflectionNotificationMock = jest.mocked(
  enableWeeklyReflectionNotification,
);

function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>{children}</I18nProvider>
    </ThemeProvider>
  );
}

function ReviewRhythmHarness() {
  const [state, setState] = useState<OnboardingState>({
    ...DEFAULT_ONBOARDING_STATE,
    currentStep: 'review-rhythm',
    weeklyReminderEnabled: false,
    reviewSchedule: 'within-3-months',
  });

  const update = (patch: OnboardingPatch) => {
    setState((current) => ({ ...current, ...patch }));
  };

  return (
    <ReviewRhythmStep state={state} update={update} hasFinishError={false} />
  );
}

describe('ReviewRhythmStep reminder UX', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('keeps an existing warning mounted while a retry is pending', async () => {
    enableWeeklyReflectionNotificationMock.mockResolvedValueOnce(
      'permission-denied',
    );

    await render(
      <Providers>
        <ReviewRhythmHarness />
      </Providers>,
    );

    const reminderSwitch = screen.getAllByRole('switch')[0];

    await act(async () => {
      await reminderSwitch.props.onPress();
    });

    const initialNotice = screen.getByTestId('notification-reminder-notice');

    let resolveRetry!: (result: 'permission-denied') => void;
    enableWeeklyReflectionNotificationMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRetry = resolve;
        }),
    );

    let retryPromise!: Promise<void>;
    await act(async () => {
      retryPromise = screen.getAllByRole('switch')[0].props.onPress();
      await Promise.resolve();
    });

    expect(screen.getByTestId('notification-reminder-notice')).toBe(
      initialNotice,
    );

    await act(async () => {
      resolveRetry('permission-denied');
      await retryPromise;
    });

    expect(screen.getByTestId('notification-reminder-notice')).toBe(
      initialNotice,
    );
  });
});
