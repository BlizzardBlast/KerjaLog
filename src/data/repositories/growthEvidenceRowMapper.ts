import { isCanonicalIsoTimestamp } from '@/domain/entry/timestamp';
import type {
  GrowthEvidenceMap,
  SkillEvidenceEntry,
  SkillEvidenceSummary,
} from '@/domain/growth/model';
import { SKILL_CATALOG } from '@/domain/skill/catalog';
import { isSkillId, type SkillId } from '@/domain/skill/model';

export type GrowthEvidenceMapRow = {
  skill_id: unknown;
  entry_count: unknown;
  total_entry_count: unknown;
};

export type SkillEvidenceEntryRow = {
  id: unknown;
  title: unknown;
  occurred_at: unknown;
  supporting_text: unknown;
};

function assertNonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`Stored Growth ${field} is invalid.`);
  }

  return value;
}

export function mapGrowthEvidenceMapRows(
  rows: GrowthEvidenceMapRow[],
): GrowthEvidenceMap {
  if (rows.length !== SKILL_CATALOG.length) {
    throw new Error('Stored Growth skill catalog is incomplete.');
  }

  const summaries = new Map<SkillId, SkillEvidenceSummary>();
  let totalEntries: number | null = null;

  for (const row of rows) {
    if (!isSkillId(row.skill_id)) {
      throw new Error('Stored Growth skill ID is invalid.');
    }

    if (summaries.has(row.skill_id)) {
      throw new Error('Stored Growth skill summary is duplicated.');
    }

    const rowTotalEntries = assertNonNegativeInteger(
      row.total_entry_count,
      'work entry count',
    );

    if (totalEntries !== null && totalEntries !== rowTotalEntries) {
      throw new Error('Stored Growth work entry count is inconsistent.');
    }

    totalEntries = rowTotalEntries;
    summaries.set(row.skill_id, {
      skillId: row.skill_id,
      entryCount: assertNonNegativeInteger(row.entry_count, 'skill entry count'),
    });
  }

  return {
    totalEntries: totalEntries ?? 0,
    skills: SKILL_CATALOG.map((skill) => {
      const summary = summaries.get(skill.id);
      if (!summary) {
        throw new Error('Stored Growth skill catalog is incomplete.');
      }
      return summary;
    }),
  };
}

export function mapSkillEvidenceEntryRows(
  rows: SkillEvidenceEntryRow[],
): SkillEvidenceEntry[] {
  return rows.map((row) => {
    if (typeof row.id !== 'string' || row.id.trim().length === 0) {
      throw new Error('Stored Growth entry ID is invalid.');
    }
    if (typeof row.title !== 'string' || row.title.trim().length === 0) {
      throw new Error('Stored Growth entry title is invalid.');
    }
    if (
      typeof row.occurred_at !== 'string' ||
      !isCanonicalIsoTimestamp(row.occurred_at)
    ) {
      throw new Error('Stored Growth entry timestamp is invalid.');
    }
    if (
      typeof row.supporting_text !== 'string' ||
      row.supporting_text.trim().length === 0
    ) {
      throw new Error('Stored Growth supporting text is invalid.');
    }

    return {
      id: row.id,
      title: row.title,
      occurredAt: row.occurred_at,
      supportingText: row.supporting_text,
    };
  });
}
