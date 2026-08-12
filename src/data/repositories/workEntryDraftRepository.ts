import { SQLiteWorkEntryDraftRepository } from '@/data/repositories/SQLiteWorkEntryDraftRepository';
import type { WorkEntryDraftRepository } from '@/domain/entry/repository';

export const workEntryDraftRepository: WorkEntryDraftRepository =
  new SQLiteWorkEntryDraftRepository();
