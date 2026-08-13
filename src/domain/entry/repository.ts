import type { WorkEntryDraft } from '@/domain/entry/draft';
import type {
  WorkEntryHistoryPage,
  WorkEntryHistoryQuery,
} from '@/domain/entry/history';
import type {
  CreateWorkEntry,
  UpdateWorkEntry,
  WorkEntry,
  WorkEntryDetail,
} from '@/domain/entry/model';

export interface WorkEntryByIdReader {
  findById(id: string): Promise<WorkEntryDetail | null>;
}

export interface RecentWorkEntryReader {
  findRecent(limit: number): Promise<WorkEntry[]>;
  countSince(occurredAtInclusive: string): Promise<number>;
}

export interface WorkEntryHistoryReader {
  findHistory(query: WorkEntryHistoryQuery): Promise<WorkEntryHistoryPage>;
}

export interface WorkEntryReader
  extends WorkEntryByIdReader,
    RecentWorkEntryReader {}

export interface WorkEntryWriter {
  /**
   * Atomically persists a captured work entry and consumes the active encrypted
   * capture draft in the same database transaction.
   */
  commit(input: CreateWorkEntry): Promise<WorkEntry>;
}

export interface WorkEntryUpdater {
  /** Atomically replaces the mutable content, evidence, and confirmed skills. */
  update(id: string, input: UpdateWorkEntry): Promise<WorkEntryDetail>;
}

export interface WorkEntryRepository
  extends WorkEntryReader,
    WorkEntryHistoryReader,
    WorkEntryWriter,
    WorkEntryUpdater {}

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
