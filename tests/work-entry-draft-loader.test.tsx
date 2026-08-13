import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { WorkEntryDraft } from '@/domain/entry/draft';
import type { WorkEntryDraftReader } from '@/domain/entry/repository';
import { useWorkEntryDraft } from '@/features/work-entry/useWorkEntryDraft';

const draft: WorkEntryDraft = {
  step: 'event',
  intent: 'completed',
  rawNote: 'Prepared the weekly report.',
  outcomeType: null,
  evidenceTypes: [],
  evidenceDetail: '',
  impactStatement: '',
  impactStatementSource: null,
};

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
});
