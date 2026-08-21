import { getDatabase } from '@/data/database';
import { withKeyedDatabaseAccess } from '@/data/keyedDatabaseAccess';
import {
  buildSkillEvidenceSqlQuery,
  GROWTH_EVIDENCE_MAP_SQL,
} from '@/data/queries/growthEvidenceQuery';
import {
  type GrowthEvidenceMapRow,
  mapGrowthEvidenceMapRows,
  mapSkillEvidenceEntryRows,
  type SkillEvidenceEntryRow,
} from '@/data/repositories/growthEvidenceRowMapper';
import type {
  GrowthEvidenceMap,
  SkillEvidenceEntry,
} from '@/domain/growth/model';
import type { GrowthEvidenceReader } from '@/domain/growth/repository';
import type { SkillId } from '@/domain/skill/model';

export class SQLiteGrowthEvidenceRepository implements GrowthEvidenceReader {
  async loadEvidenceMap(): Promise<GrowthEvidenceMap> {
    const db = await getDatabase();

    return withKeyedDatabaseAccess(async () => {
      const rows = await db.getAllAsync<GrowthEvidenceMapRow>(
        GROWTH_EVIDENCE_MAP_SQL,
      );

      return mapGrowthEvidenceMapRows(rows);
    });
  }

  async findSkillEvidence(skillId: SkillId): Promise<SkillEvidenceEntry[]> {
    const query = buildSkillEvidenceSqlQuery(skillId);
    const db = await getDatabase();

    return withKeyedDatabaseAccess(async () => {
      const rows = await db.getAllAsync<SkillEvidenceEntryRow>(
        query.sql,
        query.parameters,
      );

      return mapSkillEvidenceEntryRows(rows);
    });
  }
}
