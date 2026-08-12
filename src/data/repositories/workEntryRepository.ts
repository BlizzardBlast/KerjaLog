import { SQLiteWorkEntryRepository } from '@/data/repositories/SQLiteWorkEntryRepository';
import type { WorkEntryRepository } from '@/domain/entry/repository';

export const workEntryRepository: WorkEntryRepository =
  new SQLiteWorkEntryRepository();
