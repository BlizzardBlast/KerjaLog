import { SQLiteWorkAreaRepository } from '@/data/repositories/SQLiteWorkAreaRepository';
import type { WorkAreaRepository } from '@/domain/work-area/repository';

export const workAreaRepository: WorkAreaRepository =
  new SQLiteWorkAreaRepository();
