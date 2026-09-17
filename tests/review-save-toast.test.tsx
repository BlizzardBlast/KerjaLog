import { act, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import { ReviewSaveToast } from '@/features/review/ReviewSaveToast';

describe('ReviewSaveToast', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('announces the saved status politely and dismisses after the prototype duration', async () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();

    await render(
      <ThemeProvider>
        <ReviewSaveToast message="Changes saved." onDismiss={onDismiss} />
      </ThemeProvider>,
    );

    const toast = screen.getByRole('alert', { name: 'Changes saved.' });
    expect(toast.props.accessibilityLiveRegion).toBe('polite');

    await act(async () => {
      jest.advanceTimersByTime(2_299);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
