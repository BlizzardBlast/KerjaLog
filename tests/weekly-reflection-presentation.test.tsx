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
  test('exposes accessible headings, contextual guidance, and an explicit close action', async () => {
    await render(
      <ThemeProvider>
        <WeeklyReflectionPromptView
          currentAnswer=""
          onAnswerChange={jest.fn()}
          onClose={jest.fn()}
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
    expect(
      screen.getByPlaceholderText('reflection.placeholder.moved_forward'),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'reflection.close' }),
    ).toBeTruthy();
  });

  test('gives repeated handoff actions prompt-specific accessible names', async () => {
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

    const movedForwardButton = screen.getByRole('button', {
      name: 'reflection.summary.logPrompt:{"prompt":"reflection.prompt.moved_forward"}',
    });
    const helpedButton = screen.getByRole('button', {
      name: 'reflection.summary.logPrompt:{"prompt":"reflection.prompt.helped"}',
    });

    expect(movedForwardButton.props.accessibilityState).toEqual({
      disabled: true,
      busy: false,
    });
    expect(helpedButton.props.accessibilityState).toEqual({
      disabled: true,
      busy: true,
    });
  });
});
