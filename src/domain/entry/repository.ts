import type { CreateWorkEntry, WorkEntry } from '@/domain/entry/model';

export interface WorkEntryReader {
  findById(id: string): Promise<WorkEntry | null>;
  findRecent(limit: number): Promise<WorkEntry[]>;
}

export interface WorkEntryWriter {
  create(input: CreateWorkEntry): Promise<WorkEntry>;
}

export interface WorkEntryRepository extends WorkEntryReader, WorkEntryWriter {}
