import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import { WeeklyReflectionPromptView } from '@/features/weekly-reflection/WeeklyReflectionPromptView';
import { WeeklyReflectionSummaryView } from '@/features/weekly-reflection/WeeklyReflectionSummaryView';
import { WEEKLY_REFLECTION_PROMPTS } from '@/features/weekly-reflection/reflectionPrompts';

jest.mock('@/i18n/I18nProvider', () => ({
  useI18n: () => ({
    language: 'en',
    t: (key: string, params?: Record<string, string | number>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
  }),
}));

describe('weekly reflection presentation', () => {
  test('exposes the screen title and current prompt as accessibility headings', async () => {
    await render(
      <ThemeProvider>
        <WeeklyReflectionPromptView
          currentAnswer=""
          onAnswerChange={jest.fn()}
          onContinue={jest.fn()}
          onSkip={jest.fn()}
          prompt={WEEKLY_REFLECTION_PROMPTS[0]}
          promptIndex={0}
          totalPrompts={WEEKLY_REFLECTION_PROMPTS.length}
        />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole('header', { name: 'reflection.title' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('header', {
        name: 'reflection.prompt.moved_forward',
      }),
    ).toBeTruthy();
  });

  test('shows progress only on the reflection answer being handed off', async () => {
    await render(
      <ThemeProvider>
        <WeeklyReflectionSummaryView
          answeredPrompts={[
            {
              prompt: WEEKLY_REFLECTION_PROMPTS[0],
              answer: 'Finished the month-end report',
            },
            {
              prompt: WEEKLY_REFLECTION_PROMPTS[1],
              answer: 'Helped finance reconcile a mismatch',
            },
          ]}
          handoffState={{ status: 'saving', promptId: 'helped' }}
          onBackHome={jest.fn()}
          onLogAnswer={jest.fn()}
          onOpenDraft={jest.fn()}
        />
      </ThemeProvider>,
    );

    const logButtons = screen.getAllByRole('button', {
      name: 'reflection.summary.logThis',
    });

    expect(logButtons).toHaveLength(2);
    expect(logButtons[0]?.props.accessibilityState).toEqual({
      disabled: true,
      busy: false,
    });
    expect(logButtons[1]?.props.accessibilityState).toEqual({
      disabled: true,
      busy: true,
    });
  });
});
