import { act, renderHook } from '@testing-library/react-native';
import { useSavedEntryCompletion } from '@/features/work-entry/useSavedEntryCompletion';

describe('useSavedEntryCompletion', () => {
  test('serializes rapid completion retries after the durable write succeeds', async () => {
    let resolveRetry: (() => void) | undefined;
    const onSaved = jest
      .fn<Promise<void>, [string]>()
      .mockRejectedValueOnce(new Error('navigation unavailable'))
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveRetry = resolve;
          }),
      );
    const { result } = await renderHook(() =>
      useSavedEntryCompletion<string>(onSaved),
    );

    await act(async () => {
      await result.current.commitAndComplete('entry-1');
    });

    expect(result.current.hasCommittedEntry).toBe(true);
    expect(result.current.completionError).toBe(true);
    expect(onSaved).toHaveBeenCalledTimes(1);

    let firstRetry: Promise<void> | undefined;
    let secondRetry: Promise<void> | undefined;
    await act(async () => {
      firstRetry = result.current.retryCompletion();
      secondRetry = result.current.retryCompletion();
    });

    expect(onSaved).toHaveBeenCalledTimes(2);

    resolveRetry?.();
    await act(async () => {
      await Promise.all([firstRetry, secondRetry]);
    });

    expect(onSaved).toHaveBeenCalledTimes(2);
    expect(result.current.completionError).toBe(false);
  });
});
