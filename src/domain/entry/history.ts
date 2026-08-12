import type { EntryType, WorkEntry } from '@/domain/entry/model';

export const HISTORY_PAGE_SIZE = 50;
export const HISTORY_PAGE_MAX_SIZE = 100;
export const HISTORY_SEARCH_MAX_LENGTH = 256;
export const HISTORY_SEARCH_MAX_TERMS = 16;

export type WorkEntryHistoryFilters = {
  entryType: EntryType | null;
  hasEvidence: boolean;
  reviewReadyOnly: boolean;
};

export type WorkEntryHistoryCursor = {
  occurredAt: string;
  createdAt: string;
  id: string;
};

export type WorkEntryHistoryQuery = {
  searchText: string;
  filters: WorkEntryHistoryFilters;
  cursor: WorkEntryHistoryCursor | null;
  limit: number;
};

export type WorkEntryHistoryPage = {
  entries: WorkEntry[];
  nextCursor: WorkEntryHistoryCursor | null;
};

export const EMPTY_WORK_ENTRY_HISTORY_FILTERS: WorkEntryHistoryFilters = {
  entryType: null,
  hasEvidence: false,
  reviewReadyOnly: false,
};

export function hasWorkEntryHistoryFilters(
  filters: WorkEntryHistoryFilters,
): boolean {
  return (
    filters.entryType !== null || filters.hasEvidence || filters.reviewReadyOnly
  );
}
