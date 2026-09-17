import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import { ReviewScheduleSection } from '@/features/home/components/ReviewScheduleSection';

jest.mock('@/i18n/I18nProvider', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

jest.mock('expo-symbols', () => ({ SymbolView: () => null }));

describe('Review Builder handoffs', () => {
  test('makes the Home review card a labelled, accessible route handoff', async () => {
    const onOpenReview = jest.fn();
    await render(
      <ThemeProvider>
        <ReviewScheduleSection
          reviewSchedule="within-3-months"
          onOpenReview={onOpenReview}
        />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByRole('button', { name: 'review.open' }));
    expect(onOpenReview).toHaveBeenCalledTimes(1);
  });
});
