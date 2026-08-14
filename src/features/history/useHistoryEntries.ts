import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { workEntryRepository } from '@/data/repositories/workEntryRepository';
import {
  EMPTY_WORK_ENTRY_HISTORY_FILTERS,
  HISTORY_PAGE_SIZE,
  HISTORY_SEARCH_MAX_LENGTH,
  type WorkEntryHistoryCursor,
  type WorkEntryHistoryFilters,
  type WorkEntryHistoryQuery,
} from '@/domain/entry/history';
import type { EntryType, WorkEntry } from '@/domain/entry/model';
import type { WorkEntryHistoryReader } from '@/domain/entry/repository';

const SEARCH_DEBOUNCE_MS = 250;

type HistoryRequestRuntime = {
  requestId: number;
  nextCursor: WorkEntryHistoryCursor | null;
  pagination: 'idle' | 'loading' | 'error';
  searchPending: boolean;
};

export type HistoryEntriesState =
  | {
      status: 'loading';
      entries: WorkEntry[];
      hasMore: false;
      isLoadingMore: false;
      loadMoreError: false;
    }
  | {
      status: 'loaded';
      entries: WorkEntry[];
      hasMore: boolean;
      isLoadingMore: boolean;
      loadMoreError: boolean;
    }
  | {
      status: 'error';
      entries: [];
      hasMore: false;
      isLoadingMore: false;
      loadMoreError: false;
    };

export type HistoryEntriesController = {
  searchText: string;
  isSearchPending: boolean;
  setSearchText: (value: string) => void;
  filters: WorkEntryHistoryFilters;
  setEntryType: (entryType: EntryType | null) => void;
  toggleEvidence: () => void;
  toggleReviewReady: () => void;
  clearFilters: () => void;
  retry: () => void;
  loadMore: () => void;
  retryLoadMore: () => void;
  state: HistoryEntriesState;
};

export function useHistoryEntries(
  repository: WorkEntryHistoryReader = workEntryRepository,
): HistoryEntriesController {
  const [searchText, setSearchTextState] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [filters, setFilters] = useState<WorkEntryHistoryFilters>(
    EMPTY_WORK_ENTRY_HISTORY_FILTERS,
  );
  const [state, setState] = useState<HistoryEntriesState>({
    status: 'loading',
    entries: [],
    hasMore: false,
    isLoadingMore: false,
    loadMoreError: false,
  });
  const runtimeRef = useRef<HistoryRequestRuntime>({
    requestId: 0,
    nextCursor: null,
    pagination: 'idle',
    searchPending: false,
  });
  const isSearchPending = searchText !== debouncedSearchText;

  useEffect(() => {
    runtimeRef.current.searchPending = isSearchPending;

    if (!isSearchPending) {
      return;
    }

    const timeout = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [isSearchPending, searchText]);

  const query = useMemo<Omit<WorkEntryHistoryQuery, 'cursor' | 'limit'>>(
    () => ({
      searchText: debouncedSearchText,
      filters,
    }),
    [debouncedSearchText, filters],
  );

  const invalidateHistoryQuery = useCallback(() => {
    const runtime = runtimeRef.current;
    runtime.requestId += 1;
    runtime.nextCursor = null;
    runtime.pagination = 'idle';
  }, []);

  const loadFirstPage = useCallback(() => {
    invalidateHistoryQuery();
    const requestId = runtimeRef.current.requestId;

    setState((current) => ({
      status: 'loading',
      entries: current.status === 'error' ? [] : current.entries,
      hasMore: false,
      isLoadingMore: false,
      loadMoreError: false,
    }));

    repository
      .findHistory({
        ...query,
        cursor: null,
        limit: HISTORY_PAGE_SIZE,
      })
      .then((page) => {
        const runtime = runtimeRef.current;
        if (runtime.requestId !== requestId) {
          return;
        }

        runtime.nextCursor = page.nextCursor;
        runtime.pagination = 'idle';

        setState({
          status: 'loaded',
          entries: page.entries,
          hasMore: page.nextCursor !== null,
          isLoadingMore: false,
          loadMoreError: false,
        });
      })
      .catch(() => {
        const runtime = runtimeRef.current;
        if (runtime.requestId !== requestId) {
          return;
        }

        runtime.nextCursor = null;
        runtime.pagination = 'idle';

        setState({
          status: 'error',
          entries: [],
          hasMore: false,
          isLoadingMore: false,
          loadMoreError: false,
        });
      });
  }, [invalidateHistoryQuery, query, repository]);

  const loadMore = useCallback(() => {
    const runtime = runtimeRef.current;
    const cursor = runtime.nextCursor;

    if (
      runtime.searchPending ||
      cursor === null ||
      runtime.pagination !== 'idle'
    ) {
      return;
    }

    const requestId = runtime.requestId;
    runtime.pagination = 'loading';

    setState((current) =>
      current.status === 'loaded'
        ? { ...current, isLoadingMore: true, loadMoreError: false }
        : current,
    );

    repository
      .findHistory({
        ...query,
        cursor,
        limit: HISTORY_PAGE_SIZE,
      })
      .then((page) => {
        const currentRuntime = runtimeRef.current;
        if (currentRuntime.requestId !== requestId) {
          return;
        }

        currentRuntime.nextCursor = page.nextCursor;
        currentRuntime.pagination = 'idle';

        setState((current) => {
          if (current.status !== 'loaded') {
            return current;
          }

          const existingIds = new Set(current.entries.map((entry) => entry.id));
          const newEntries = page.entries.filter(
            (entry) => !existingIds.has(entry.id),
          );

          return {
            status: 'loaded',
            entries: [...current.entries, ...newEntries],
            hasMore: page.nextCursor !== null,
            isLoadingMore: false,
            loadMoreError: false,
          };
        });
      })
      .catch(() => {
        const currentRuntime = runtimeRef.current;
        if (currentRuntime.requestId !== requestId) {
          return;
        }

        currentRuntime.pagination = 'error';

        setState((current) =>
          current.status === 'loaded'
            ? { ...current, isLoadingMore: false, loadMoreError: true }
            : current,
        );
      });
  }, [query, repository]);

  const retryLoadMore = useCallback(() => {
    const runtime = runtimeRef.current;
    if (runtime.searchPending || runtime.pagination !== 'error') {
      return;
    }

    runtime.pagination = 'idle';
    loadMore();
  }, [loadMore]);

  useFocusEffect(
    useCallback(() => {
      loadFirstPage();

      return () => {
        invalidateHistoryQuery();
        runtimeRef.current.searchPending = false;
      };
    }, [invalidateHistoryQuery, loadFirstPage]),
  );

  const setSearchText = useCallback(
    (value: string) => {
      const nextSearchText = value.slice(0, HISTORY_SEARCH_MAX_LENGTH);

      if (nextSearchText === searchText) {
        return;
      }

      invalidateHistoryQuery();
      runtimeRef.current.searchPending =
        nextSearchText !== debouncedSearchText;
      setSearchTextState(nextSearchText);
    },
    [debouncedSearchText, invalidateHistoryQuery, searchText],
  );

  const setEntryType = useCallback(
    (entryType: EntryType | null) => {
      if (entryType === filters.entryType) {
        return;
      }

      invalidateHistoryQuery();
      setFilters((current) => ({ ...current, entryType }));
    },
    [filters.entryType, invalidateHistoryQuery],
  );

  const toggleEvidence = useCallback(() => {
    invalidateHistoryQuery();
    setFilters((current) => ({
      ...current,
      hasEvidence: !current.hasEvidence,
    }));
  }, [invalidateHistoryQuery]);

  const toggleReviewReady = useCallback(() => {
    invalidateHistoryQuery();
    setFilters((current) => ({
      ...current,
      reviewReadyOnly: !current.reviewReadyOnly,
    }));
  }, [invalidateHistoryQuery]);

  const clearFilters = useCallback(() => {
    if (
      filters.entryType === null &&
      !filters.hasEvidence &&
      !filters.reviewReadyOnly
    ) {
      return;
    }

    invalidateHistoryQuery();
    setFilters(EMPTY_WORK_ENTRY_HISTORY_FILTERS);
  }, [filters, invalidateHistoryQuery]);

  return {
    searchText,
    isSearchPending,
    setSearchText,
    filters,
    setEntryType,
    toggleEvidence,
    toggleReviewReady,
    clearFilters,
    retry: loadFirstPage,
    loadMore,
    retryLoadMore,
    state,
  };
}
