import { SQLiteGrowthEvidenceRepository } from '@/data/repositories/SQLiteGrowthEvidenceRepository';
import type { GrowthEvidenceReader } from '@/domain/growth/repository';

export const growthEvidenceRepository: GrowthEvidenceReader =
  new SQLiteGrowthEvidenceRepository();
