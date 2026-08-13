import { act, renderHook, waitFor } from '@testing-library/react-native';
import type {
  WorkEntryHistoryCursor,
  WorkEntryHistoryPage,
} from '@/domain/entry/history';
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

const secondEntry: WorkEntry = {
  ...entry,
  id: 'entry-2',
  title: 'Second entry',
  occurredAt: '2026-08-05T08:00:00.000Z',
  createdAt: '2026-08-05T08:01:00.000Z',
  updatedAt: '2026-08-05T08:01:00.000Z',
};

const cursor: WorkEntryHistoryCursor = {
  occurredAt: entry.occurredAt,
  createdAt: entry.createdAt,
  id: entry.id,
};

function page(
  entries: WorkEntry[],
  nextCursor: WorkEntryHistoryCursor | null = null,
): WorkEntryHistoryPage {
  return { entries, nextCursor };
}

function createRepository(): jest.Mocked<WorkEntryHistoryReader> {
  return {
    findHistory: jest.fn().mockResolvedValue(page([entry])),
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

describe('History entries controller', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('loads History through the narrow read capability', async () => {
    const repository = createRepository();
    const { result } = renderHook(() => useHistoryEntries(repository));

    await waitFor(() => expect(result.current.state.status).toBe('loaded'));

    expect(repository.findHistory).toHaveBeenCalledWith({
      searchText: '',
      filters: {
        entryType: null,
        hasEvidence: false,
        reviewReadyOnly: false,
      },
      cursor: null,
      limit: 50,
    });
    expect(result.current.state.entries).toEqual([entry]);
  });

  test('combines practical filters without copying entries into global state', async () => {
    const repository = createRepository();
    const { result } = renderHook(() => useHistoryEntries(repository));

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
        cursor: null,
        limit: 50,
      }),
    );
  });

  test('debounces search and exposes pending query state', async () => {
    const repository = createRepository();
    const { result } = renderHook(() => useHistoryEntries(repository));

    await waitFor(() => expect(result.current.state.status).toBe('loaded'));
    jest.useFakeTimers();

    await act(async () => {
      result.current.setSearchText('finance');
    });

    expect(result.current.isSearchPending).toBe(true);
    expect(repository.findHistory).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(249);
    });
    expect(repository.findHistory).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    jest.useRealTimers();

    await waitFor(() =>
      expect(repository.findHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({ searchText: 'finance' }),
      ),
    );
    await waitFor(() => expect(result.current.isSearchPending).toBe(false));
  });

  test('does not paginate the previous query while a search is pending', async () => {
    const repository = createRepository();
    repository.findHistory.mockResolvedValueOnce(page([entry], cursor));
    const { result } = renderHook(() => useHistoryEntries(repository));

    await waitFor(() => expect(result.current.state.status).toBe('loaded'));
    jest.useFakeTimers();

    await act(async () => {
      result.current.setSearchText('finance');
    });

    expect(result.current.isSearchPending).toBe(true);

    await act(async () => {
      result.current.loadMore();
    });
    expect(repository.findHistory).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    jest.useRealTimers();

    await waitFor(() => expect(repository.findHistory).toHaveBeenCalledTimes(2));
    expect(repository.findHistory).toHaveBeenLastCalledWith({
      searchText: 'finance',
      filters: {
        entryType: null,
        hasEvidence: false,
        reviewReadyOnly: false,
      },
      cursor: null,
      limit: 50,
    });
  });

  test('ignores an older request that resolves after a newer query', async () => {
    const first = deferred<WorkEntryHistoryPage>();
    const second = deferred<WorkEntryHistoryPage>();
    const repository: jest.Mocked<WorkEntryHistoryReader> = {
      findHistory: jest
        .fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise),
    };
    const { result } = renderHook(() => useHistoryEntries(repository));

    await act(async () => {
      result.current.setEntryType('problem_solved');
    });

    await waitFor(() =>
      expect(repository.findHistory).toHaveBeenCalledTimes(2),
    );

    await act(async () => {
      second.resolve(page([secondEntry]));
    });
    await waitFor(() =>
      expect(result.current.state.entries).toEqual([secondEntry]),
    );

    await act(async () => {
      first.resolve(page([entry]));
    });

    expect(result.current.state.entries).toEqual([secondEntry]);
  });

  test('loads the next cursor page and appends unique entries', async () => {
    const repository = createRepository();
    repository.findHistory
      .mockResolvedValueOnce(page([entry], cursor))
      .mockResolvedValueOnce(page([secondEntry]));
    const { result } = renderHook(() => useHistoryEntries(repository));

    await waitFor(() => expect(result.current.state.status).toBe('loaded'));

    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() =>
      expect(result.current.state.entries).toEqual([entry, secondEntry]),
    );
    expect(repository.findHistory).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursor }),
    );
    expect(
      result.current.state.status === 'loaded' && result.current.state.hasMore,
    ).toBe(false);
  });

  test('requires an explicit retry after a load-more failure', async () => {
    const repository = createRepository();
    repository.findHistory
      .mockResolvedValueOnce(page([entry], cursor))
      .mockRejectedValueOnce(new Error('next page unavailable'))
      .mockResolvedValueOnce(page([secondEntry]));
    const { result } = renderHook(() => useHistoryEntries(repository));

    await waitFor(() => expect(result.current.state.status).toBe('loaded'));

    await act(async () => {
      result.current.loadMore();
    });
    await waitFor(() =>
      expect(
        result.current.state.status === 'loaded' &&
          result.current.state.loadMoreError,
      ).toBe(true),
    );
    expect(repository.findHistory).toHaveBeenCalledTimes(2);

    await act(async () => {
      result.current.loadMore();
    });
    expect(repository.findHistory).toHaveBeenCalledTimes(2);

    await act(async () => {
      result.current.retryLoadMore();
    });
    await waitFor(() =>
      expect(result.current.state.entries).toEqual([entry, secondEntry]),
    );
    expect(repository.findHistory).toHaveBeenCalledTimes(3);
  });

  test('surfaces repository failures and retries explicitly', async () => {
    const repository = createRepository();
    repository.findHistory
      .mockRejectedValueOnce(new Error('database unavailable'))
      .mockResolvedValueOnce(page([entry]));
    const { result } = renderHook(() => useHistoryEntries(repository));

    await waitFor(() => expect(result.current.state.status).toBe('error'));
    expect(result.current.state.entries).toEqual([]);

    await act(async () => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.state.status).toBe('loaded'));
    expect(result.current.state.entries).toEqual([entry]);
  });
});
