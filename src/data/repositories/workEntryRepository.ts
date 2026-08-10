import { AsyncStorageWorkEntryRepository } from '@/data/repositories/AsyncStorageWorkEntryRepository';
import type { WorkEntryRepository } from '@/domain/entry/repository';

export const workEntryRepository: WorkEntryRepository =
  new AsyncStorageWorkEntryRepository();
