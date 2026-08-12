import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { WorkEntry } from '@/domain/entry/model';
import type { WorkEntryHistoryReader } from '@/domain/entry/repository';
import { useHistoryEntries } from '@/features/history/useHistoryEntries';

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  return {
    useFocusEffect: (effect: import('react').EffectCallback) => {
      React.useEffect(effect, [effect]);
    },
  };
});

const entry: WorkEntry = {
  id: 'entry-1',
  type: 'problem_solved',
  title: 'Resolved reconciliation discrepancies',
  rawNote: 'Found duplicate reconciliation records.',
  impactStatement: 'Removed duplicate records before submission.',
  occurredAt: '2026-08-06T08:00:00.000Z',
  outcomeType: 'error_fixed_or_prevented',
  status: 'review_ready',
  evidence: {
    types: ['number'],
    detail: '7 duplicate entries removed.',
  },
  excludedFromExports: false,
  createdAt: '2026-08-06T08:01:00.000Z',
  updatedAt: '2026-08-06T08:01:00.000Z',
};

function createRepository(): jest.Mocked<WorkEntryHistoryReader> {
  return {
    findHistory: jest.fn().mockResolvedValue([entry]),
  };
}

describe('History entries controller', () => {
  test('loads History through the narrow read capability', async () => {
    const repository = createRepository();
    const { result } = await renderHook(() => useHistoryEntries(repository));

    await waitFor(() => expect(result.current.state.status).toBe('loaded'));

    expect(repository.findHistory).toHaveBeenCalledWith({
      searchText: '',
      filters: {
        entryType: null,
        hasEvidence: false,
        reviewReadyOnly: false,
      },
    });
    expect(result.current.state.entries).toEqual([entry]);
  });

  test('combines practical filters without copying entries into global state', async () => {
    const repository = createRepository();
    const { result } = await renderHook(() => useHistoryEntries(repository));

    await waitFor(() => expect(result.current.state.status).toBe('loaded'));

    await act(async () => {
      result.current.setEntryType('problem_solved');
      result.current.toggleEvidence();
      result.current.toggleReviewReady();
    });

    await waitFor(() =>
      expect(repository.findHistory).toHaveBeenLastCalledWith({
        searchText: '',
        filters: {
          entryType: 'problem_solved',
          hasEvidence: true,
          reviewReadyOnly: true,
        },
      }),
    );
  });

  test('surfaces repository failures and retries explicitly', async () => {
    const repository = createRepository();
    repository.findHistory
      .mockRejectedValueOnce(new Error('database unavailable'))
      .mockResolvedValueOnce([entry]);
    const { result } = await renderHook(() => useHistoryEntries(repository));

    await waitFor(() => expect(result.current.state.status).toBe('error'));
    expect(result.current.state.entries).toEqual([]);

    await act(async () => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.state.status).toBe('loaded'));
    expect(result.current.state.entries).toEqual([entry]);
  });
});
