import type { WorkEntryDraft } from '@/domain/entry/draft';
import type { CreateWorkEntry, WorkEntry } from '@/domain/entry/model';

export interface WorkEntryByIdReader {
  findById(id: string): Promise<WorkEntry | null>;
}

export interface RecentWorkEntryReader {
  findRecent(limit: number): Promise<WorkEntry[]>;
  countSince(occurredAtInclusive: string): Promise<number>;
}

export interface WorkEntryReader
  extends WorkEntryByIdReader,
    RecentWorkEntryReader {}

export interface WorkEntryWriter {
  create(input: CreateWorkEntry): Promise<WorkEntry>;
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
