import { SQLitePortableBackupRepository } from '@/data/repositories/SQLitePortableBackupRepository';
import type { PortableBackupRepository } from '@/domain/portability/repository';

export const portableBackupRepository: PortableBackupRepository =
  new SQLitePortableBackupRepository();
