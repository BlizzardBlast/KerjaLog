import { act, renderHook } from '@testing-library/react-native';
import type { WorkEntryDraft } from '@/domain/entry/draft';
import type { WorkEntryDraftWriter } from '@/domain/entry/repository';
import { usePersistedLogDraft } from '@/features/work-entry/usePersistedLogDraft';

const draft: WorkEntryDraft = {
  step: 'event',
  intent: 'completed',
  rawNote: 'Prepared the weekly report.',
  outcomeType: null,
  evidenceTypes: [],
  evidenceDetail: '',
  impactStatement: '',
};

function createRepository(): jest.Mocked<WorkEntryDraftWriter> {
  return {
    saveActive: jest.fn().mockResolvedValue(undefined),
    clearActive: jest.fn().mockResolvedValue(undefined),
  };
}

describe('usePersistedLogDraft', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('debounces encrypted draft persistence', async () => {
    const repository = createRepository();
    await renderHook(() =>
      usePersistedLogDraft({ draft, enabled: true, repository }),
    );

    expect(repository.saveActive).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(350);
      await Promise.resolve();
    });

    expect(repository.saveActive).toHaveBeenCalledWith(draft);
  });

  test('clears a pristine draft instead of storing empty content', async () => {
    const repository = createRepository();
    const emptyDraft: WorkEntryDraft = {
      step: 'type',
      intent: null,
      rawNote: '',
      outcomeType: null,
      evidenceTypes: [],
      evidenceDetail: '',
      impactStatement: '',
    };
    await renderHook(() =>
      usePersistedLogDraft({ draft: emptyDraft, enabled: true, repository }),
    );

    await act(async () => {
      jest.advanceTimersByTime(350);
      await Promise.resolve();
    });

    expect(repository.clearActive).toHaveBeenCalledTimes(1);
    expect(repository.saveActive).not.toHaveBeenCalled();
  });

  test('stops autosaving after the work entry has committed', async () => {
    const repository = createRepository();
    const { rerender } = await renderHook(
      ({ enabled }: { enabled: boolean }) =>
        usePersistedLogDraft({ draft, enabled, repository }),
      { initialProps: { enabled: true } },
    );

    await rerender({ enabled: false });
    await act(async () => {
      jest.advanceTimersByTime(350);
      await Promise.resolve();
    });

    expect(repository.saveActive).not.toHaveBeenCalled();
    expect(repository.clearActive).not.toHaveBeenCalled();
  });

  test('synchronously suspends queued persistence during commit or discard finalization', async () => {
    const repository = createRepository();
    const suspendedRef = { current: true };
    await renderHook(() =>
      usePersistedLogDraft({
        draft,
        enabled: true,
        suspendedRef,
        repository,
      }),
    );

    await act(async () => {
      jest.advanceTimersByTime(350);
      await Promise.resolve();
    });

    expect(repository.saveActive).not.toHaveBeenCalled();
    expect(repository.clearActive).not.toHaveBeenCalled();
  });

  test('surfaces encrypted draft persistence failures', async () => {
    const repository = createRepository();
    repository.saveActive.mockRejectedValueOnce(new Error('disk unavailable'));
    const { result } = await renderHook(() =>
      usePersistedLogDraft({ draft, enabled: true, repository }),
    );

    await act(async () => {
      jest.advanceTimersByTime(350);
      await Promise.resolve();
    });

    expect(result.current).toBe(true);
  });
});
