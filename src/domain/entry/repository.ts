import type { WorkEntryDraft } from '@/domain/entry/draft';
import type { WorkEntryHistoryQuery } from '@/domain/entry/history';
import type { CreateWorkEntry, WorkEntry } from '@/domain/entry/model';

export interface WorkEntryByIdReader {
  findById(id: string): Promise<WorkEntry | null>;
}

export interface RecentWorkEntryReader {
  findRecent(limit: number): Promise<WorkEntry[]>;
  countSince(occurredAtInclusive: string): Promise<number>;
}

export interface WorkEntryHistoryReader {
  findHistory(query: WorkEntryHistoryQuery): Promise<WorkEntry[]>;
}

export interface WorkEntryReader
  extends WorkEntryByIdReader,
    RecentWorkEntryReader,
    WorkEntryHistoryReader {}

export interface WorkEntryWriter {
  /**
   * Atomically persists a captured work entry and consumes the active encrypted
   * capture draft in the same database transaction.
   */
  commit(input: CreateWorkEntry): Promise<WorkEntry>;
}

export interface WorkEntryRepository extends WorkEntryReader, WorkEntryWriter {}

export interface WorkEntryDraftReader {
  loadActive(): Promise<WorkEntryDraft | null>;
}

export interface WorkEntryDraftWriter {
  saveActive(draft: WorkEntryDraft): Promise<void>;
  clearActive(): Promise<void>;
}

export interface WorkEntryDraftRepository
  extends WorkEntryDraftReader,
    WorkEntryDraftWriter {}
