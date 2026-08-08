import { fireEvent, render, screen } from '@testing-library/react-native';
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

  test('keeps the warning visible across a failed retry', async () => {
    enableWeeklyReflectionNotificationMock.mockResolvedValue(
      'permission-denied',
    );

    await render(
      <Providers>
        <ReviewRhythmHarness />
      </Providers>,
    );

    await fireEvent.press(screen.getAllByRole('switch')[0]);
    expect(await screen.findByRole('alert')).toBeOnTheScreen();

    await fireEvent.press(screen.getAllByRole('switch')[0]);
    expect(await screen.findByRole('alert')).toBeOnTheScreen();

    expect(enableWeeklyReflectionNotificationMock).toHaveBeenCalledTimes(2);
  });
});
