import type { CreateWorkEntry, WorkEntry } from '@/domain/entry/model';

export interface WorkEntryRepository {
  findById(id: string): Promise<WorkEntry | null>;
  findRecent(limit: number): Promise<WorkEntry[]>;
  create(input: CreateWorkEntry): Promise<WorkEntry>;
}
