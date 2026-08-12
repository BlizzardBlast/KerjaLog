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
  const requestIdRef = useRef(0);
  const nextCursorRef = useRef<WorkEntryHistoryCursor | null>(null);
  const hasMoreRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const loadMoreErrorRef = useRef(false);

  useEffect(() => {
    if (searchText === debouncedSearchText) {
      return;
    }

    const timeout = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [debouncedSearchText, searchText]);

  const query = useMemo<Omit<WorkEntryHistoryQuery, 'cursor' | 'limit'>>(
    () => ({
      searchText: debouncedSearchText,
      filters,
    }),
    [debouncedSearchText, filters],
  );

  const loadFirstPage = useCallback(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    nextCursorRef.current = null;
    hasMoreRef.current = false;
    isLoadingMoreRef.current = false;
    loadMoreErrorRef.current = false;

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
        if (requestIdRef.current !== requestId) {
          return;
        }

        nextCursorRef.current = page.nextCursor;
        hasMoreRef.current = page.nextCursor !== null;

        setState({
          status: 'loaded',
          entries: page.entries,
          hasMore: page.nextCursor !== null,
          isLoadingMore: false,
          loadMoreError: false,
        });
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) {
          return;
        }

        nextCursorRef.current = null;
        hasMoreRef.current = false;

        setState({
          status: 'error',
          entries: [],
          hasMore: false,
          isLoadingMore: false,
          loadMoreError: false,
        });
      });
  }, [query, repository]);

  const loadMore = useCallback(() => {
    const cursor = nextCursorRef.current;

    if (
      cursor === null ||
      !hasMoreRef.current ||
      isLoadingMoreRef.current ||
      loadMoreErrorRef.current
    ) {
      return;
    }

    const requestId = requestIdRef.current;
    isLoadingMoreRef.current = true;

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
        if (requestIdRef.current !== requestId) {
          return;
        }

        nextCursorRef.current = page.nextCursor;
        hasMoreRef.current = page.nextCursor !== null;
        isLoadingMoreRef.current = false;
        loadMoreErrorRef.current = false;

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
        if (requestIdRef.current !== requestId) {
          return;
        }

        isLoadingMoreRef.current = false;
        loadMoreErrorRef.current = true;

        setState((current) =>
          current.status === 'loaded'
            ? { ...current, isLoadingMore: false, loadMoreError: true }
            : current,
        );
      });
  }, [query, repository]);

  const retryLoadMore = useCallback(() => {
    if (!loadMoreErrorRef.current || isLoadingMoreRef.current) {
      return;
    }

    loadMoreErrorRef.current = false;
    loadMore();
  }, [loadMore]);

  useFocusEffect(
    useCallback(() => {
      loadFirstPage();

      return () => {
        requestIdRef.current += 1;
        isLoadingMoreRef.current = false;
        loadMoreErrorRef.current = false;
      };
    }, [loadFirstPage]),
  );

  const setSearchText = useCallback((value: string) => {
    setSearchTextState(value.slice(0, HISTORY_SEARCH_MAX_LENGTH));
  }, []);

  const setEntryType = useCallback((entryType: EntryType | null) => {
    setFilters((current) => ({ ...current, entryType }));
  }, []);

  const toggleEvidence = useCallback(() => {
    setFilters((current) => ({
      ...current,
      hasEvidence: !current.hasEvidence,
    }));
  }, []);

  const toggleReviewReady = useCallback(() => {
    setFilters((current) => ({
      ...current,
      reviewReadyOnly: !current.reviewReadyOnly,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_WORK_ENTRY_HISTORY_FILTERS);
  }, []);

  return {
    searchText,
    isSearchPending: searchText !== debouncedSearchText,
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
