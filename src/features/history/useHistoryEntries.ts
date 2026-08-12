import { useFocusEffect } from 'expo-router';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { workEntryRepository } from '@/data/repositories/workEntryRepository';
import {
  EMPTY_WORK_ENTRY_HISTORY_FILTERS,
  type WorkEntryHistoryFilters,
  type WorkEntryHistoryQuery,
} from '@/domain/entry/history';
import type { EntryType, WorkEntry } from '@/domain/entry/model';
import type { WorkEntryHistoryReader } from '@/domain/entry/repository';

const SEARCH_DEBOUNCE_MS = 250;

export type HistoryEntriesState =
  | { status: 'loading'; entries: WorkEntry[] }
  | { status: 'loaded'; entries: WorkEntry[] }
  | { status: 'error'; entries: [] };

export type HistoryEntriesController = {
  searchText: string;
  setSearchText: (value: string) => void;
  filters: WorkEntryHistoryFilters;
  setEntryType: (entryType: EntryType | null) => void;
  toggleEvidence: () => void;
  toggleReviewReady: () => void;
  clearFilters: () => void;
  retry: () => void;
  state: HistoryEntriesState;
};

export function useHistoryEntries(
  repository: WorkEntryHistoryReader = workEntryRepository,
): HistoryEntriesController {
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [filters, setFilters] = useState<WorkEntryHistoryFilters>(
    EMPTY_WORK_ENTRY_HISTORY_FILTERS,
  );
  const [reloadVersion, setReloadVersion] = useState(0);
  const [state, setState] = useState<HistoryEntriesState>({
    status: 'loading',
    entries: [],
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [searchText]);

  const query = useMemo<WorkEntryHistoryQuery>(
    () => ({
      searchText: debouncedSearchText,
      filters,
    }),
    [debouncedSearchText, filters],
  );

  useFocusEffect(
    useCallback(() => {
      let ignore = false;

      setState((current) => ({
        status: 'loading',
        entries: current.status === 'error' ? [] : current.entries,
      }));

      repository
        .findHistory(query)
        .then((entries) => {
          if (!ignore) {
            setState({ status: 'loaded', entries });
          }
        })
        .catch(() => {
          if (!ignore) {
            setState({ status: 'error', entries: [] });
          }
        });

      return () => {
        ignore = true;
      };
    }, [query, reloadVersion, repository]),
  );

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

  const retry = useCallback(() => {
    setReloadVersion((current) => current + 1);
  }, []);

  return {
    searchText,
    setSearchText,
    filters,
    setEntryType,
    toggleEvidence,
    toggleReviewReady,
    clearFilters,
    retry,
    state,
  };
}
