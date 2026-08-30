import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import {
  IMPACT_STATEMENT_SOURCES,
  type CreateWorkEntry,
  type WorkEntry,
} from '@/domain/entry/model';
import { isCanonicalIsoTimestamp } from '@/domain/entry/timestamp';
import {
  ENTRY_SKILL_SOURCES,
  SKILL_IDS,
  type WorkEntrySkill,
} from '@/domain/skill/model';

export function dedupeWorkEntrySkills(
  skills: WorkEntrySkill[],
): WorkEntrySkill[] {
  return [...new Map(skills.map((skill) => [skill.id, skill])).values()];
}

export async function insertWorkEntryEvidence(
  db: SQLiteDatabase,
  entryId: string,
  evidence: WorkEntry['evidence'],
  createdAt: string,
): Promise<void> {
  for (const type of evidence?.types ?? []) {
    await db.runAsync(
      `
        INSERT INTO evidence (
          id,
          entry_id,
          type,
          text_value,
          created_at
        )
        VALUES ($id, $entryId, $type, $textValue, $createdAt)
      `,
      {
        $id: Crypto.randomUUID(),
        $entryId: entryId,
        $type: type,
        $textValue: evidence?.detail ?? null,
        $createdAt: createdAt,
      },
    );
  }
}

export async function replaceWorkEntryEvidence(
  db: SQLiteDatabase,
  entryId: string,
  evidence: WorkEntry['evidence'],
  updatedAt: string,
): Promise<void> {
  await db.runAsync('DELETE FROM evidence WHERE entry_id = $id', {
    $id: entryId,
  });
  await insertWorkEntryEvidence(db, entryId, evidence, updatedAt);
}

export async function insertWorkEntrySkills(
  db: SQLiteDatabase,
  entryId: string,
  skills: WorkEntrySkill[],
): Promise<void> {
  for (const skill of skills) {
    await db.runAsync(
      `
        INSERT INTO entry_skills (entry_id, skill_id, source)
        VALUES ($entryId, $skillId, $source)
      `,
      {
        $entryId: entryId,
        $skillId: skill.id,
        $source: skill.source,
      },
    );
  }
}

export async function replaceWorkEntrySkills(
  db: SQLiteDatabase,
  entryId: string,
  skills: WorkEntrySkill[],
): Promise<void> {
  await db.runAsync('DELETE FROM entry_skills WHERE entry_id = $id', {
    $id: entryId,
  });
  await insertWorkEntrySkills(db, entryId, skills);
}

export function assertWorkEntryWriteInput(
  input: Pick<
    CreateWorkEntry,
    | 'occurredAt'
    | 'impactStatement'
    | 'impactStatementSource'
    | 'skills'
    | 'workAreaId'
  >,
): void {
  if (!isCanonicalIsoTimestamp(input.occurredAt)) {
    throw new Error(
      'Work entry occurred at must be a canonical ISO timestamp.',
    );
  }

  if (
    input.workAreaId !== null &&
    (typeof input.workAreaId !== 'string' || !input.workAreaId.trim())
  ) {
    throw new Error('Work entry work area id is invalid.');
  }

  const hasStatement = input.impactStatement !== null;
  const hasSource = input.impactStatementSource !== null;
  if (hasStatement !== hasSource) {
    throw new Error('Work entry impact statement provenance is inconsistent.');
  }

  if (
    input.impactStatementSource !== null &&
    !IMPACT_STATEMENT_SOURCES.includes(input.impactStatementSource)
  ) {
    throw new Error('Work entry impact statement source is invalid.');
  }

  for (const skill of input.skills) {
    if (
      !SKILL_IDS.includes(skill.id) ||
      !ENTRY_SKILL_SOURCES.includes(skill.source)
    ) {
      throw new Error('Work entry skill is invalid.');
    }
  }
}
