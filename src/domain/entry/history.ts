import type { EntryType } from '@/domain/entry/model';

export type WorkEntryHistoryFilters = {
  entryType: EntryType | null;
  hasEvidence: boolean;
  reviewReadyOnly: boolean;
};

export type WorkEntryHistoryQuery = {
  searchText: string;
  filters: WorkEntryHistoryFilters;
};

export const EMPTY_WORK_ENTRY_HISTORY_FILTERS: WorkEntryHistoryFilters = {
  entryType: null,
  hasEvidence: false,
  reviewReadyOnly: false,
};

export const EMPTY_WORK_ENTRY_HISTORY_QUERY: WorkEntryHistoryQuery = {
  searchText: '',
  filters: EMPTY_WORK_ENTRY_HISTORY_FILTERS,
};

export function hasWorkEntryHistoryFilters(
  filters: WorkEntryHistoryFilters,
): boolean {
  return (
    filters.entryType !== null || filters.hasEvidence || filters.reviewReadyOnly
  );
}
