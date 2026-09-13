import * as Crypto from 'expo-crypto';
import { getDatabase } from '@/data/database';
import {
  withKeyedDatabaseAccess,
  withKeyedTransaction,
} from '@/data/keyedDatabaseAccess';
import type {
  PortableActiveDraft,
  PortableBackup,
  PortablePreferences,
} from '@/domain/portability/model';
import { parsePortableBackup } from '@/domain/portability/model';
import type { PortableBackupRepository } from '@/domain/portability/repository';
import { createWorkAreaNameKey } from '@/domain/work-area/validation';

type Row = Record<string, unknown>;

export class SQLitePortableBackupRepository
  implements PortableBackupRepository
{
  async exportBackup(
    preferences: PortablePreferences,
  ): Promise<PortableBackup> {
    const db = await getDatabase();
    return withKeyedDatabaseAccess(async () => {
      const workAreas = await db.getAllAsync<Row>(
        `SELECT id, name, archived_at, created_at, updated_at
         FROM work_areas
         ORDER BY created_at ASC, id ASC`,
      );
      const entryRows = await db.getAllAsync<Row>(
        `SELECT id, type, title, raw_note, impact_statement,
          impact_statement_source, occurred_at, outcome_type, status,
          work_area_id, excluded_from_exports, created_at, updated_at
         FROM work_entries
         ORDER BY created_at ASC, id ASC`,
      );
      const evidenceRows = await db.getAllAsync<Row>(
        `SELECT entry_id, type, text_value
         FROM evidence
         ORDER BY entry_id ASC, created_at ASC, id ASC`,
      );
      const skillRows = await db.getAllAsync<Row>(
        `SELECT entry_id, skill_id, source
         FROM entry_skills
         ORDER BY entry_id ASC, skill_id ASC`,
      );
      const activeDraft = await db.getFirstAsync<Row>(
        `SELECT step, intent, raw_note, work_area_id, outcome_type,
          evidence_types, evidence_detail, selected_skills, impact_statement,
          impact_statement_source, updated_at
         FROM active_work_entry_draft WHERE id = 1`,
      );
      const reviewDraftRows = await db.getAllAsync<Row>(
        `SELECT id, title, purpose, period_start_date, period_end_date,
          document_json, created_at, updated_at
         FROM review_drafts
         ORDER BY created_at ASC, id ASC`,
      );
      const reviewEntryRows = await db.getAllAsync<Row>(
        `SELECT review_draft_id, source_entry_id, title, statement,
          evidence_detail, occurred_at, sort_order
         FROM review_draft_entries
         ORDER BY review_draft_id ASC, sort_order ASC`,
      );

      const evidenceByEntry = groupEvidence(evidenceRows);
      const skillsByEntry = groupSkills(skillRows);
      const reviewEntriesByDraft = groupReviewEntries(reviewEntryRows);

      return parsePortableBackup({
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          workAreas: workAreas.map((area) => ({
            id: area.id,
            name: area.name,
            archivedAt: area.archived_at,
            createdAt: area.created_at,
            updatedAt: area.updated_at,
          })),
          entries: entryRows.map((entry) => {
            const id = requireNonEmptyText(entry.id, 'entry id');
            return {
              id,
              type: entry.type,
              title: entry.title,
              rawNote: entry.raw_note,
              impactStatement: entry.impact_statement,
              impactStatementSource: entry.impact_statement_source,
              occurredAt: entry.occurred_at,
              outcomeType: entry.outcome_type,
              status: entry.status,
              workAreaId: entry.work_area_id,
              evidence: evidenceByEntry.get(id) ?? null,
              excludedFromExports: mapBoolean(
                entry.excluded_from_exports,
                'entry private flag',
              ),
              createdAt: entry.created_at,
              updatedAt: entry.updated_at,
              skills: skillsByEntry.get(id) ?? [],
            };
          }),
          activeDraft: activeDraft ? mapActiveDraft(activeDraft) : null,
          reviewDrafts: reviewDraftRows.map((draft) => {
            const id = requireNonEmptyText(draft.id, 'review draft id');
            return {
              id,
              title: draft.title,
              purpose: draft.purpose,
              period: {
                startDate: draft.period_start_date,
                endDate: draft.period_end_date,
              },
              document: parseStoredJson(draft.document_json, 'review document'),
              entries: reviewEntriesByDraft.get(id) ?? [],
              createdAt: draft.created_at,
              updatedAt: draft.updated_at,
            };
          }),
          preferences: {
            themeMode: preferences.themeMode,
            language: preferences.language,
            onboarding: preferences.onboarding,
          },
        },
      });
    });
  }

  async replaceWithBackup(backup: PortableBackup): Promise<void> {
    const validated = parsePortableBackup(backup);
    const db = await getDatabase();

    await withKeyedTransaction(db, async (transaction) => {
      await transaction.runAsync('DELETE FROM review_drafts');
      await transaction.runAsync('DELETE FROM active_work_entry_draft');
      await transaction.runAsync('DELETE FROM work_entries');
      await transaction.runAsync('DELETE FROM work_areas');

      for (const area of validated.data.workAreas) {
        await transaction.runAsync(
          `INSERT INTO work_areas (
            id, name, name_key, archived_at, created_at, updated_at
          ) VALUES (
            $id, $name, $nameKey, $archivedAt, $createdAt, $updatedAt
          )`,
          {
            $id: area.id,
            $name: area.name,
            $nameKey: createWorkAreaNameKey(area.name),
            $archivedAt: area.archivedAt,
            $createdAt: area.createdAt,
            $updatedAt: area.updatedAt,
          },
        );
      }

      for (const entry of validated.data.entries) {
        await transaction.runAsync(
          `INSERT INTO work_entries (
            id, type, title, raw_note, impact_statement,
            impact_statement_source, occurred_at, outcome_type, status,
            work_area_id, excluded_from_exports, created_at, updated_at
          ) VALUES (
            $id, $type, $title, $rawNote, $impactStatement,
            $impactStatementSource, $occurredAt, $outcomeType, $status,
            $workAreaId, $excludedFromExports, $createdAt, $updatedAt
          )`,
          {
            $id: entry.id,
            $type: entry.type,
            $title: entry.title,
            $rawNote: entry.rawNote,
            $impactStatement: entry.impactStatement,
            $impactStatementSource: entry.impactStatementSource,
            $occurredAt: entry.occurredAt,
            $outcomeType: entry.outcomeType,
            $status: entry.status,
            $workAreaId: entry.workAreaId,
            $excludedFromExports: entry.excludedFromExports ? 1 : 0,
            $createdAt: entry.createdAt,
            $updatedAt: entry.updatedAt,
          },
        );

        if (entry.evidence) {
          for (const type of entry.evidence.types) {
            await transaction.runAsync(
              `INSERT INTO evidence (id, entry_id, type, text_value, created_at)
               VALUES ($id, $entryId, $type, $textValue, $createdAt)`,
              {
                $id: Crypto.randomUUID(),
                $entryId: entry.id,
                $type: type,
                $textValue: entry.evidence.detail,
                $createdAt: entry.createdAt,
              },
            );
          }
        }

        for (const skill of entry.skills) {
          await transaction.runAsync(
            `INSERT INTO entry_skills (entry_id, skill_id, source)
             VALUES ($entryId, $skillId, $source)`,
            {
              $entryId: entry.id,
              $skillId: skill.id,
              $source: skill.source,
            },
          );
        }
      }

      if (validated.data.activeDraft) {
        const { draft, updatedAt } = validated.data.activeDraft;
        await transaction.runAsync(
          `INSERT INTO active_work_entry_draft (
            id, step, intent, raw_note, work_area_id, outcome_type,
            evidence_types, evidence_detail, selected_skills, impact_statement,
            impact_statement_source, updated_at
          ) VALUES (
            1, $step, $intent, $rawNote, $workAreaId, $outcomeType,
            $evidenceTypes, $evidenceDetail, $selectedSkills, $impactStatement,
            $impactStatementSource, $updatedAt
          )`,
          {
            $step: draft.step,
            $intent: draft.intent,
            $rawNote: draft.rawNote,
            $workAreaId: draft.workAreaId,
            $outcomeType: draft.outcomeType,
            $evidenceTypes: JSON.stringify(draft.evidenceTypes),
            $evidenceDetail: draft.evidenceDetail,
            $selectedSkills: JSON.stringify(draft.skills),
            $impactStatement: draft.impactStatement,
            $impactStatementSource: draft.impactStatementSource,
            $updatedAt: updatedAt,
          },
        );
      }

      for (const draft of validated.data.reviewDrafts) {
        await transaction.runAsync(
          `INSERT INTO review_drafts (
            id, title, purpose, period_start_date, period_end_date,
            document_json, created_at, updated_at
          ) VALUES (
            $id, $title, $purpose, $periodStartDate, $periodEndDate,
            $documentJson, $createdAt, $updatedAt
          )`,
          {
            $id: draft.id,
            $title: draft.title,
            $purpose: draft.purpose,
            $periodStartDate: draft.period.startDate,
            $periodEndDate: draft.period.endDate,
            $documentJson: JSON.stringify(draft.document),
            $createdAt: draft.createdAt,
            $updatedAt: draft.updatedAt,
          },
        );
        for (const entry of draft.entries) {
          await transaction.runAsync(
            `INSERT INTO review_draft_entries (
              review_draft_id, source_entry_id, title, statement,
              evidence_detail, occurred_at, sort_order
            ) VALUES (
              $reviewDraftId, $sourceEntryId, $title, $statement,
              $evidenceDetail, $occurredAt, $sortOrder
            )`,
            {
              $reviewDraftId: draft.id,
              $sourceEntryId: entry.sourceEntryId,
              $title: entry.title,
              $statement: entry.statement,
              $evidenceDetail: entry.evidenceDetail,
              $occurredAt: entry.occurredAt,
              $sortOrder: entry.sortOrder,
            },
          );
        }
      }
    });
  }
}

function groupEvidence(rows: readonly Row[]) {
  const result = new Map<string, { types: unknown[]; detail: unknown }>();
  for (const row of rows) {
    const entryId = requireNonEmptyText(row.entry_id, 'evidence entry id');
    const existing = result.get(entryId);
    if (existing) {
      if (existing.detail !== row.text_value) {
        throw new Error('Stored evidence is inconsistent.');
      }
      existing.types.push(row.type);
    } else {
      result.set(entryId, { types: [row.type], detail: row.text_value });
    }
  }
  return result;
}

function groupSkills(rows: readonly Row[]) {
  const result = new Map<string, Array<{ id: unknown; source: unknown }>>();
  for (const row of rows) {
    const entryId = requireNonEmptyText(row.entry_id, 'entry skill entry id');
    const skills = result.get(entryId) ?? [];
    skills.push({ id: row.skill_id, source: row.source });
    result.set(entryId, skills);
  }
  return result;
}

function groupReviewEntries(rows: readonly Row[]) {
  const result = new Map<string, Row[]>();
  for (const row of rows) {
    const draftId = requireNonEmptyText(
      row.review_draft_id,
      'review draft entry draft id',
    );
    const entries = result.get(draftId) ?? [];
    entries.push({
      sourceEntryId: row.source_entry_id,
      title: row.title,
      statement: row.statement,
      evidenceDetail: row.evidence_detail,
      occurredAt: row.occurred_at,
      sortOrder: row.sort_order,
    });
    result.set(draftId, entries);
  }
  return result;
}

function mapActiveDraft(row: Row): PortableActiveDraft {
  return {
    draft: {
      step: row.step as PortableActiveDraft['draft']['step'],
      intent: row.intent as PortableActiveDraft['draft']['intent'],
      rawNote: row.raw_note as string,
      workAreaId: row.work_area_id as string | null,
      outcomeType:
        row.outcome_type as PortableActiveDraft['draft']['outcomeType'],
      evidenceTypes: parseStoredJson(
        row.evidence_types,
        'draft evidence',
      ) as PortableActiveDraft['draft']['evidenceTypes'],
      evidenceDetail: row.evidence_detail as string,
      skills: parseStoredJson(
        row.selected_skills,
        'draft skills',
      ) as PortableActiveDraft['draft']['skills'],
      impactStatement: row.impact_statement as string,
      impactStatementSource:
        row.impact_statement_source as PortableActiveDraft['draft']['impactStatementSource'],
    },
    updatedAt: row.updated_at as string,
  };
}

function mapBoolean(value: unknown, field: string): boolean {
  if (value === 0) {
    return false;
  }
  if (value === 1) {
    return true;
  }
  throw new Error(`Stored ${field} is invalid.`);
}

function parseStoredJson(value: unknown, field: string): unknown {
  if (typeof value !== 'string') {
    throw new Error(`Stored ${field} is invalid.`);
  }
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`Stored ${field} is invalid.`);
  }
}

function requireNonEmptyText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Stored ${field} is invalid.`);
  }
  return value;
}
