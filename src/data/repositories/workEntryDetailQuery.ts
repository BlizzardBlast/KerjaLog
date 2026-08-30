import type { SQLiteDatabase } from 'expo-sqlite';
import {
  type JoinedWorkEntryRow,
  mapJoinedWorkEntryRows,
} from '@/data/repositories/workEntryRowMapper';
import {
  mapWorkEntrySkillRows,
  type WorkEntrySkillRow,
} from '@/data/repositories/workEntrySkillRowMapper';
import {
  IMPACT_STATEMENT_SOURCES,
  type ImpactStatementSource,
  type WorkEntryDetail,
} from '@/domain/entry/model';

type DetailedJoinedWorkEntryRow = JoinedWorkEntryRow & {
  impact_statement_source: unknown;
};

export async function findWorkEntryDetail(
  db: SQLiteDatabase,
  id: string,
): Promise<WorkEntryDetail | null> {
  const rows = await db.getAllAsync<DetailedJoinedWorkEntryRow>(
    `
      SELECT
        work_entries.id,
        work_entries.type,
        work_entries.title,
        work_entries.raw_note,
        work_entries.impact_statement,
        work_entries.impact_statement_source,
        work_entries.occurred_at,
        work_entries.outcome_type,
        work_entries.status,
        work_entries.work_area_id,
        work_entries.excluded_from_exports,
        work_entries.created_at,
        work_entries.updated_at,
        evidence.type AS evidence_type,
        evidence.text_value AS evidence_text_value
      FROM work_entries
      LEFT JOIN evidence
        ON evidence.entry_id = work_entries.id
      WHERE work_entries.id = $id
      ORDER BY evidence.created_at ASC
    `,
    { $id: id },
  );

  const firstRow = rows[0];
  const entry = mapJoinedWorkEntryRows(rows)[0];
  if (!entry || !firstRow) {
    return null;
  }

  const skillRows = await db.getAllAsync<WorkEntrySkillRow>(
    `
      SELECT skill_id, source
      FROM entry_skills
      WHERE entry_id = $id
      ORDER BY skill_id ASC
    `,
    { $id: id },
  );

  return {
    ...entry,
    skills: mapWorkEntrySkillRows(skillRows),
    impactStatementSource: mapImpactStatementSource(
      firstRow.impact_statement_source,
      entry.impactStatement,
    ),
  };
}

function mapImpactStatementSource(
  value: unknown,
  impactStatement: string | null,
): ImpactStatementSource | null {
  if (value === null) {
    if (impactStatement !== null) {
      throw new Error('Stored work entry impact provenance is inconsistent.');
    }
    return null;
  }

  if (
    typeof value !== 'string' ||
    !IMPACT_STATEMENT_SOURCES.includes(value as ImpactStatementSource)
  ) {
    throw new Error('Stored work entry impact source is invalid.');
  }

  if (impactStatement === null) {
    throw new Error('Stored work entry impact provenance is inconsistent.');
  }

  return value as ImpactStatementSource;
}
