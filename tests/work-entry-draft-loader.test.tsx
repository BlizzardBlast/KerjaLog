import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { WorkEntryDraft } from '@/domain/entry/draft';
import type { WorkEntryDraftReader } from '@/domain/entry/repository';
import { useWorkEntryDraft } from '@/features/work-entry/useWorkEntryDraft';

const draft: WorkEntryDraft = {
  step: 'event',
  intent: 'completed',
  rawNote: 'Prepared the weekly report.',
  workAreaId: null,
  outcomeType: null,
  evidenceTypes: [],
  evidenceDetail: '',
  skills: [],
  impactStatement: '',
  impactStatementSource: null,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

describe('useWorkEntryDraft', () => {
  test('restores an encrypted active draft', async () => {
    const repository: WorkEntryDraftReader = {
      loadActive: jest.fn().mockResolvedValue(draft),
    };
    const { result } = await renderHook(() => useWorkEntryDraft(repository));

    await waitFor(() => expect(result.current.state.status).toBe('loaded'));
    expect(result.current.state).toEqual({ status: 'loaded', draft });
  });

  test('supports retry after encrypted draft loading fails', async () => {
    const loadActive = jest
      .fn()
      .mockRejectedValueOnce(new Error('read failed'))
      .mockResolvedValueOnce(draft);
    const repository: WorkEntryDraftReader = { loadActive };
    const { result } = await renderHook(() => useWorkEntryDraft(repository));

    await waitFor(() => expect(result.current.state.status).toBe('error'));

    await act(async () => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.state.status).toBe('loaded'));
    expect(loadActive).toHaveBeenCalledTimes(2);
  });

  test('ignores a stale encrypted-draft response after retry', async () => {
    const first = deferred<WorkEntryDraft | null>();
    const second = deferred<WorkEntryDraft | null>();
    const repository: WorkEntryDraftReader = {
      loadActive: jest
        .fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise),
    };
    const { result } = await renderHook(() => useWorkEntryDraft(repository));

    await act(async () => {
      result.current.retry();
    });
    await act(async () => {
      second.resolve(draft);
    });
    await waitFor(() => expect(result.current.state.status).toBe('loaded'));

    await act(async () => {
      first.resolve(null);
    });

    expect(result.current.state).toEqual({ status: 'loaded', draft });
  });
});
