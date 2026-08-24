import { act, renderHook, waitFor } from '@testing-library/react-native';
import { EMPTY_WORK_ENTRY_DRAFT } from '@/domain/entry/draft';
import { useWeeklyReflectionController } from '@/features/weekly-reflection/useWeeklyReflectionController';

const loadActive = jest.fn();
const saveActive = jest.fn();

jest.mock('@/data/repositories/workEntryDraftRepository', () => ({
  workEntryDraftRepository: {
    loadActive: (...args: unknown[]) => loadActive(...args),
    saveActive: (...args: unknown[]) => saveActive(...args),
  },
}));

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));

describe('weekly reflection controller', () => {
  beforeEach(() => {
    loadActive.mockReset();
    saveActive.mockReset();
  });

  test('lets users skip every prompt without creating an answer', async () => {
    const onOpenLog = jest.fn();
    const { result } = await renderHook(() =>
      useWeeklyReflectionController({ onOpenLog }),
    );

    for (let index = 0; index < 4; index += 1) {
      act(() => result.current.advance(false));
    }

    expect(result.current.reviewing).toBe(true);
    expect(result.current.answeredPrompts).toEqual([]);
    expect(saveActive).not.toHaveBeenCalled();
    expect(onOpenLog).not.toHaveBeenCalled();
  });

  test('seeds the encrypted work-entry draft before opening Log', async () => {
    loadActive.mockResolvedValue(null);
    saveActive.mockResolvedValue(undefined);
    const onOpenLog = jest.fn();
    const { result } = await renderHook(() =>
      useWeeklyReflectionController({ onOpenLog }),
    );

    await act(async () => {
      await result.current.handoffToLog(
        'problem',
        'Resolved a duplicate reconciliation issue',
      );
    });

    expect(saveActive).toHaveBeenCalledWith({
      ...EMPTY_WORK_ENTRY_DRAFT,
      step: 'event',
      intent: 'solved',
      rawNote: 'Resolved a duplicate reconciliation issue',
    });
    expect(onOpenLog).toHaveBeenCalledTimes(1);
    expect(result.current.handoffState).toBe('idle');
  });

  test('never overwrites an existing unfinished work-entry draft', async () => {
    loadActive.mockResolvedValue({
      ...EMPTY_WORK_ENTRY_DRAFT,
      step: 'event',
      intent: 'completed',
      rawNote: 'Existing unfinished note',
    });
    const onOpenLog = jest.fn();
    const { result } = await renderHook(() =>
      useWeeklyReflectionController({ onOpenLog }),
    );

    await act(async () => {
      await result.current.handoffToLog('helped', 'Helped the operations team');
    });

    await waitFor(() =>
      expect(result.current.handoffState).toBe('active-draft'),
    );
    expect(saveActive).not.toHaveBeenCalled();
    expect(onOpenLog).not.toHaveBeenCalled();
  });
});
