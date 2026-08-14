import { getDatabase } from '@/data/database';
import { withKeyedDatabaseAccess } from '@/data/keyedDatabaseAccess';
import {
  isEvidenceType,
  isImpactStatementSource,
  isLogEventIntent,
  isOutcomeType,
  isWorkEntryDraftStep,
  type WorkEntryDraft,
  WORK_ENTRY_DRAFT_STEPS,
} from '@/domain/entry/draft';
import type { WorkEntryDraftRepository } from '@/domain/entry/repository';

const ACTIVE_DRAFT_ID = 1;

type ActiveDraftRow = {
  step: unknown;
  intent: unknown;
  raw_note: unknown;
  outcome_type: unknown;
  evidence_types: unknown;
  evidence_detail: unknown;
  impact_statement: unknown;
  impact_statement_source: unknown;
};

export class SQLiteWorkEntryDraftRepository
  implements WorkEntryDraftRepository
{
  async loadActive(): Promise<WorkEntryDraft | null> {
    const db = await getDatabase();
    return withKeyedDatabaseAccess(async () => {
      const row = await db.getFirstAsync<ActiveDraftRow>(
        `SELECT step, intent, raw_note, outcome_type, evidence_types, evidence_detail,
          impact_statement, impact_statement_source
         FROM active_work_entry_draft WHERE id = $id`,
        { $id: ACTIVE_DRAFT_ID },
      );
      return row ? mapActiveDraftRow(row) : null;
    });
  }

  async saveActive(draft: WorkEntryDraft): Promise<void> {
    const db = await getDatabase();
    const updatedAt = new Date().toISOString();
    await withKeyedDatabaseAccess(async () => {
      await db.runAsync(
        `INSERT INTO active_work_entry_draft (
          id, step, intent, raw_note, outcome_type, evidence_types, evidence_detail,
          impact_statement, impact_statement_source, updated_at
        ) VALUES (
          $id, $step, $intent, $rawNote, $outcomeType, $evidenceTypes, $evidenceDetail,
          $impactStatement, $impactStatementSource, $updatedAt
        ) ON CONFLICT(id) DO UPDATE SET
          step = excluded.step,
          intent = excluded.intent,
          raw_note = excluded.raw_note,
          outcome_type = excluded.outcome_type,
          evidence_types = excluded.evidence_types,
          evidence_detail = excluded.evidence_detail,
          impact_statement = excluded.impact_statement,
          impact_statement_source = excluded.impact_statement_source,
          updated_at = excluded.updated_at`,
        {
          $id: ACTIVE_DRAFT_ID,
          $step: draft.step,
          $intent: draft.intent,
          $rawNote: draft.rawNote,
          $outcomeType: draft.outcomeType,
          $evidenceTypes: JSON.stringify(draft.evidenceTypes),
          $evidenceDetail: draft.evidenceDetail,
          $impactStatement: draft.impactStatement,
          $impactStatementSource: draft.impactStatementSource,
          $updatedAt: updatedAt,
        },
      );
    });
  }

  async clearActive(): Promise<void> {
    const db = await getDatabase();
    await withKeyedDatabaseAccess(async () => {
      await db.runAsync('DELETE FROM active_work_entry_draft WHERE id = $id', {
        $id: ACTIVE_DRAFT_ID,
      });
    });
  }
}

function mapActiveDraftRow(row: ActiveDraftRow): WorkEntryDraft {
  if (!isWorkEntryDraftStep(row.step)) {
    throw new Error('Stored work entry draft step is invalid.');
  }
  if (row.intent !== null && !isLogEventIntent(row.intent)) {
    throw new Error('Stored work entry draft intent is invalid.');
  }
  if (typeof row.raw_note !== 'string') {
    throw new Error('Stored work entry draft note is invalid.');
  }
  if (row.outcome_type !== null && !isOutcomeType(row.outcome_type)) {
    throw new Error('Stored work entry draft outcome is invalid.');
  }
  if (
    typeof row.evidence_detail !== 'string' ||
    typeof row.impact_statement !== 'string'
  ) {
    throw new Error('Stored work entry draft text is invalid.');
  }
  if (
    row.impact_statement_source !== null &&
    !isImpactStatementSource(row.impact_statement_source)
  ) {
    throw new Error('Stored work entry draft impact source is invalid.');
  }

  const draft: WorkEntryDraft = {
    step: row.step,
    intent: row.intent,
    rawNote: row.raw_note,
    outcomeType: row.outcome_type,
    evidenceTypes: parseEvidenceTypes(row.evidence_types),
    evidenceDetail: row.evidence_detail,
    impactStatement: row.impact_statement,
    impactStatementSource: row.impact_statement_source,
  };
  assertDraftProgression(draft);
  return draft;
}

function parseEvidenceTypes(value: unknown): WorkEntryDraft['evidenceTypes'] {
  if (typeof value !== 'string') {
    throw new Error('Stored work entry draft evidence is invalid.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('Stored work entry draft evidence is invalid.');
  }

  if (!Array.isArray(parsed) || !parsed.every(isEvidenceType)) {
    throw new Error('Stored work entry draft evidence is invalid.');
  }
  if (new Set(parsed).size !== parsed.length) {
    throw new Error('Stored work entry draft evidence contains duplicates.');
  }
  return parsed;
}

function assertDraftProgression(draft: WorkEntryDraft): void {
  const stepIndex = WORK_ENTRY_DRAFT_STEPS.indexOf(draft.step);
  if (stepIndex >= 1 && draft.intent === null) {
    throw new Error('Stored work entry draft is missing its event type.');
  }
  if (stepIndex >= 2 && draft.rawNote.trim().length === 0) {
    throw new Error('Stored work entry draft is missing its note.');
  }
  if (stepIndex >= 3 && draft.outcomeType === null) {
    throw new Error('Stored work entry draft is missing its outcome.');
  }
}
