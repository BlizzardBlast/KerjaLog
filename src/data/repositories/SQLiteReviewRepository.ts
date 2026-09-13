import * as Crypto from 'expo-crypto';
import { getDatabase } from '@/data/database';
import {
  withKeyedDatabaseAccess,
  withKeyedTransaction,
} from '@/data/keyedDatabaseAccess';
import { EVIDENCE_TYPES, OUTCOME_TYPES } from '@/domain/entry/model';
import { isCanonicalIsoTimestamp } from '@/domain/entry/timestamp';
import {
  REVIEW_PURPOSES,
  type CreateReviewDraft,
  type ReviewCandidate,
  type ReviewDraft,
  type ReviewDraftDocument,
  type ReviewDraftEntrySnapshot,
  type ReviewPurpose,
  type UpdateReviewDraft,
} from '@/domain/review/model';
import { assertReviewPeriod } from '@/domain/review/period';
import type {
  ReviewCandidateQuery,
  ReviewRepository,
} from '@/domain/review/repository';
import { isSkillId } from '@/domain/skill/model';

type ReviewCandidateRow = {
  id: unknown;
  title: unknown;
  impact_statement: unknown;
  raw_note: unknown;
  occurred_at: unknown;
  outcome_type: unknown;
  evidence_type: unknown;
  evidence_detail: unknown;
  skill_id: unknown;
};

type ReviewDraftRow = {
  id: unknown;
  title: unknown;
  purpose: unknown;
  period_start_date: unknown;
  period_end_date: unknown;
  document_json: unknown;
  created_at: unknown;
  updated_at: unknown;
};

type ReviewDraftEntryRow = {
  source_entry_id: unknown;
  title: unknown;
  statement: unknown;
  evidence_detail: unknown;
  occurred_at: unknown;
  sort_order: unknown;
};

export class SQLiteReviewRepository implements ReviewRepository {
  async findCandidates(
    query: ReviewCandidateQuery,
  ): Promise<ReviewCandidate[]> {
    assertReviewPeriod(query.period);
    if (query.skillId !== null && !isSkillId(query.skillId)) {
      throw new Error('Review candidate skill filter is invalid.');
    }

    const db = await getDatabase();
    return withKeyedDatabaseAccess(async () => {
      const rows = await db.getAllAsync<ReviewCandidateRow>(
        `
          SELECT
            work_entries.id,
            work_entries.title,
            work_entries.impact_statement,
            work_entries.raw_note,
            work_entries.occurred_at,
            work_entries.outcome_type,
            evidence.type AS evidence_type,
            evidence.text_value AS evidence_detail,
            entry_skills.skill_id
          FROM work_entries
          LEFT JOIN evidence ON evidence.entry_id = work_entries.id
          LEFT JOIN entry_skills ON entry_skills.entry_id = work_entries.id
          WHERE work_entries.status = 'review_ready'
            AND work_entries.excluded_from_exports = 0
            AND date(work_entries.occurred_at, 'localtime') >= $startDate
            AND date(work_entries.occurred_at, 'localtime') <= $endDate
            AND ($skillId IS NULL OR entry_skills.skill_id = $skillId)
          ORDER BY
            work_entries.occurred_at DESC,
            work_entries.id ASC,
            evidence.type ASC,
            entry_skills.skill_id ASC
        `,
        {
          $startDate: query.period.startDate,
          $endDate: query.period.endDate,
          $skillId: query.skillId,
        },
      );
      return mapReviewCandidateRows(rows);
    });
  }

  async listDrafts(): Promise<ReviewDraft[]> {
    const db = await getDatabase();
    return withKeyedDatabaseAccess(async () => {
      const rows = await db.getAllAsync<ReviewDraftRow>(
        `SELECT id, title, purpose, period_start_date, period_end_date,
          document_json, created_at, updated_at
         FROM review_drafts
         ORDER BY updated_at DESC, created_at DESC, id DESC`,
      );
      return Promise.all(rows.map((row) => loadReviewDraft(db, row)));
    });
  }

  async findDraft(id: string): Promise<ReviewDraft | null> {
    assertId(id, 'Review draft');
    const db = await getDatabase();
    return withKeyedDatabaseAccess(async () => {
      const row = await db.getFirstAsync<ReviewDraftRow>(
        `SELECT id, title, purpose, period_start_date, period_end_date,
          document_json, created_at, updated_at
         FROM review_drafts WHERE id = $id`,
        { $id: id },
      );
      return row ? loadReviewDraft(db, row) : null;
    });
  }

  async createDraft(input: CreateReviewDraft): Promise<ReviewDraft> {
    assertCreateReviewDraft(input);
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();
    const db = await getDatabase();

    return withKeyedTransaction(db, async (transaction) => {
      await transaction.runAsync(
        `INSERT INTO review_drafts (
          id, title, purpose, period_start_date, period_end_date, document_json,
          created_at, updated_at
        ) VALUES (
          $id, $title, $purpose, $periodStartDate, $periodEndDate, $documentJson,
          $createdAt, $updatedAt
        )`,
        {
          $id: id,
          $title: input.title.trim(),
          $purpose: input.purpose,
          $periodStartDate: input.period.startDate,
          $periodEndDate: input.period.endDate,
          $documentJson: JSON.stringify(input.document),
          $createdAt: now,
          $updatedAt: now,
        },
      );
      await insertReviewDraftEntries(transaction, id, input.entries);
      return {
        ...input,
        id,
        title: input.title.trim(),
        entries: sortSnapshots(input.entries),
        createdAt: now,
        updatedAt: now,
      };
    });
  }

  async updateDraft(
    id: string,
    input: UpdateReviewDraft,
  ): Promise<ReviewDraft> {
    assertId(id, 'Review draft');
    assertUpdateReviewDraft(input);
    const db = await getDatabase();
    const updatedAt = new Date().toISOString();
    return withKeyedTransaction(db, async (transaction) => {
      const result = await transaction.runAsync(
        `UPDATE review_drafts
         SET title = $title, document_json = $documentJson, updated_at = $updatedAt
         WHERE id = $id`,
        {
          $id: id,
          $title: input.title.trim(),
          $documentJson: JSON.stringify(input.document),
          $updatedAt: updatedAt,
        },
      );
      if (result.changes !== 1) {
        throw new Error('Review draft to update was not found.');
      }
      const row = await transaction.getFirstAsync<ReviewDraftRow>(
        `SELECT id, title, purpose, period_start_date, period_end_date,
          document_json, created_at, updated_at
         FROM review_drafts WHERE id = $id`,
        { $id: id },
      );
      if (!row) {
        throw new Error('Updated review draft could not be reloaded.');
      }
      return loadReviewDraft(transaction, row);
    });
  }

  async deleteDraft(id: string): Promise<void> {
    assertId(id, 'Review draft');
    const db = await getDatabase();
    await withKeyedDatabaseAccess(async () => {
      const result = await db.runAsync(
        'DELETE FROM review_drafts WHERE id = $id',
        {
          $id: id,
        },
      );
      if (result.changes !== 1) {
        throw new Error('Review draft to delete was not found.');
      }
    });
  }
}

async function insertReviewDraftEntries(
  db: {
    runAsync: (
      sql: string,
      parameters: Record<string, string | number | null>,
    ) => Promise<unknown>;
  },
  reviewDraftId: string,
  entries: readonly ReviewDraftEntrySnapshot[],
): Promise<void> {
  for (const entry of sortSnapshots(entries)) {
    await db.runAsync(
      `INSERT INTO review_draft_entries (
        review_draft_id, source_entry_id, title, statement, evidence_detail,
        occurred_at, sort_order
      ) VALUES (
        $reviewDraftId, $sourceEntryId, $title, $statement, $evidenceDetail,
        $occurredAt, $sortOrder
      )`,
      {
        $reviewDraftId: reviewDraftId,
        $sourceEntryId: entry.sourceEntryId,
        $title: entry.title.trim(),
        $statement: entry.statement.trim(),
        $evidenceDetail: entry.evidenceDetail?.trim() || null,
        $occurredAt: entry.occurredAt,
        $sortOrder: entry.sortOrder,
      },
    );
  }
}

async function loadReviewDraft(
  db: {
    getAllAsync: <T>(
      sql: string,
      parameters: Record<string, string>,
    ) => Promise<T[]>;
  },
  row: ReviewDraftRow,
): Promise<ReviewDraft> {
  const draft = mapReviewDraftRow(row);
  const entries = await db.getAllAsync<ReviewDraftEntryRow>(
    `SELECT source_entry_id, title, statement, evidence_detail, occurred_at, sort_order
     FROM review_draft_entries
     WHERE review_draft_id = $reviewDraftId
     ORDER BY sort_order ASC`,
    { $reviewDraftId: draft.id },
  );
  return { ...draft, entries: entries.map(mapReviewDraftEntryRow) };
}

function mapReviewCandidateRows(rows: ReviewCandidateRow[]): ReviewCandidate[] {
  const candidates = new Map<string, ReviewCandidate>();
  for (const row of rows) {
    const id = expectNonEmptyString(row.id, 'review candidate id');
    let candidate = candidates.get(id);
    if (!candidate) {
      candidate = {
        id,
        title: expectNonEmptyString(row.title, 'review candidate title'),
        impactStatement: expectNullableText(
          row.impact_statement,
          'review candidate impact statement',
        ),
        rawNote: expectNonEmptyString(row.raw_note, 'review candidate note'),
        occurredAt: expectIsoTimestamp(
          row.occurred_at,
          'review candidate date',
        ),
        outcomeType:
          row.outcome_type === null
            ? null
            : expectOneOf(
                row.outcome_type,
                OUTCOME_TYPES,
                'review candidate outcome',
              ),
        evidence: null,
        skillIds: [],
      };
      candidates.set(id, candidate);
    }
    if (row.evidence_type !== null || row.evidence_detail !== null) {
      const detail = expectNonEmptyString(
        row.evidence_detail,
        'review candidate evidence',
      );
      candidate.evidence ??= { types: [], detail };
      if (candidate.evidence.detail !== detail) {
        throw new Error('Stored review candidate evidence is inconsistent.');
      }
      const type = expectOneOf(
        row.evidence_type,
        EVIDENCE_TYPES,
        'review candidate evidence type',
      );
      if (!candidate.evidence.types.includes(type)) {
        candidate.evidence.types.push(type);
      }
    }
    if (row.skill_id !== null) {
      if (!isSkillId(row.skill_id)) {
        throw new Error('Stored review candidate skill is invalid.');
      }
      if (!candidate.skillIds.includes(row.skill_id)) {
        candidate.skillIds.push(row.skill_id);
      }
    }
  }
  return [...candidates.values()];
}

function mapReviewDraftRow(row: ReviewDraftRow): Omit<ReviewDraft, 'entries'> {
  const purpose = expectReviewPurpose(row.purpose);
  const period = {
    startDate: expectNonEmptyString(
      row.period_start_date,
      'review period start',
    ),
    endDate: expectNonEmptyString(row.period_end_date, 'review period end'),
  };
  assertReviewPeriod(period);
  return {
    id: expectNonEmptyString(row.id, 'review draft id'),
    title: expectNonEmptyString(row.title, 'review draft title'),
    purpose,
    period,
    document: parseReviewDocument(row.document_json),
    createdAt: expectIsoTimestamp(row.created_at, 'review draft created at'),
    updatedAt: expectIsoTimestamp(row.updated_at, 'review draft updated at'),
  };
}

function mapReviewDraftEntryRow(
  row: ReviewDraftEntryRow,
): ReviewDraftEntrySnapshot {
  const sortOrder = row.sort_order;
  if (
    typeof sortOrder !== 'number' ||
    !Number.isInteger(sortOrder) ||
    sortOrder < 0
  ) {
    throw new Error('Stored review draft entry order is invalid.');
  }
  return {
    sourceEntryId: expectNonEmptyString(
      row.source_entry_id,
      'review draft source entry',
    ),
    title: expectNonEmptyString(row.title, 'review draft entry title'),
    statement: expectNonEmptyString(
      row.statement,
      'review draft entry statement',
    ),
    evidenceDetail: expectNullableText(
      row.evidence_detail,
      'review draft entry evidence',
    ),
    occurredAt: expectIsoTimestamp(row.occurred_at, 'review draft entry date'),
    sortOrder,
  };
}

function assertCreateReviewDraft(input: CreateReviewDraft): void {
  assertUpdateReviewDraft(input);
  if (!REVIEW_PURPOSES.includes(input.purpose)) {
    throw new Error('Review draft purpose is invalid.');
  }
  assertReviewPeriod(input.period);
  const ids = new Set<string>();
  const orders = new Set<number>();
  for (const entry of input.entries) {
    assertId(entry.sourceEntryId, 'Review draft source entry');
    if (
      !entry.title.trim() ||
      !entry.statement.trim() ||
      !isCanonicalIsoTimestamp(entry.occurredAt)
    ) {
      throw new Error('Review draft source snapshot is invalid.');
    }
    if (
      !Number.isInteger(entry.sortOrder) ||
      entry.sortOrder < 0 ||
      ids.has(entry.sourceEntryId) ||
      orders.has(entry.sortOrder)
    ) {
      throw new Error('Review draft source snapshots are invalid.');
    }
    ids.add(entry.sourceEntryId);
    orders.add(entry.sortOrder);
  }
}

function assertUpdateReviewDraft(input: UpdateReviewDraft): void {
  if (!input.title.trim()) {
    throw new Error('Review draft title is required.');
  }
  assertReviewDocument(input.document);
}

function assertReviewDocument(document: ReviewDraftDocument): void {
  if (!Array.isArray(document.sections)) {
    throw new Error('Review draft document is invalid.');
  }
  const ids = new Set<string>();
  for (const section of document.sections) {
    if (
      typeof section !== 'object' ||
      section === null ||
      !('id' in section) ||
      !('title' in section) ||
      !('bullets' in section) ||
      typeof section.id !== 'string' ||
      typeof section.title !== 'string' ||
      !section.id.trim() ||
      !section.title.trim() ||
      !Array.isArray(section.bullets) ||
      ids.has(section.id)
    ) {
      throw new Error('Review draft section is invalid.');
    }
    if (
      !section.bullets.every(
        (bullet) => typeof bullet === 'string' && bullet.trim(),
      )
    ) {
      throw new Error('Review draft bullet is invalid.');
    }
    ids.add(section.id);
  }
}

function parseReviewDocument(value: unknown): ReviewDraftDocument {
  if (typeof value !== 'string') {
    throw new Error('Stored review draft document is invalid.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('Stored review draft document is invalid.');
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('sections' in parsed)
  ) {
    throw new Error('Stored review draft document is invalid.');
  }
  assertReviewDocument(parsed as ReviewDraftDocument);
  return parsed as ReviewDraftDocument;
}

function sortSnapshots(
  entries: readonly ReviewDraftEntrySnapshot[],
): ReviewDraftEntrySnapshot[] {
  return [...entries].sort((left, right) => left.sortOrder - right.sortOrder);
}

function expectReviewPurpose(value: unknown): ReviewPurpose {
  if (
    typeof value !== 'string' ||
    !REVIEW_PURPOSES.includes(value as ReviewPurpose)
  ) {
    throw new Error('Stored review draft purpose is invalid.');
  }
  return value as ReviewPurpose;
}

function expectNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Stored ${field} is invalid.`);
  }
  return value;
}

function expectNullableText(value: unknown, field: string): string | null {
  if (value === null) {
    return null;
  }
  return expectNonEmptyString(value, field);
}

function expectIsoTimestamp(value: unknown, field: string): string {
  if (!isCanonicalIsoTimestamp(value)) {
    throw new Error(`Stored ${field} is invalid.`);
  }
  return value;
}

function expectOneOf<const Values extends readonly string[]>(
  value: unknown,
  values: Values,
  field: string,
): Values[number] {
  if (typeof value !== 'string' || !values.includes(value as Values[number])) {
    throw new Error(`Stored ${field} is invalid.`);
  }
  return value as Values[number];
}

function assertId(id: string, label: string): void {
  if (!id.trim()) {
    throw new Error(`${label} id is required.`);
  }
}
