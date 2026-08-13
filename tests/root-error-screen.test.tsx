import { fireEvent, render, screen } from '@testing-library/react-native';
import { RootErrorScreen } from '@/shared/components/RootErrorScreen';

describe('RootErrorScreen', () => {
  test('exposes an alert and retries the failed route', async () => {
    const onRetry = jest.fn().mockResolvedValue(undefined);

    await render(<RootErrorScreen onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
