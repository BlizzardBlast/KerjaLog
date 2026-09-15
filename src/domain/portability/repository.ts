import type {
  PortableBackup,
  PortablePreferences,
} from '@/domain/portability/model';

export interface PortableBackupRepository {
  exportBackup(preferences: PortablePreferences): Promise<PortableBackup>;
  replaceWithBackup(backup: PortableBackup): Promise<void>;
}
