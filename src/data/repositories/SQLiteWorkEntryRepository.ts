import * as Crypto from 'expo-crypto';
import { getDatabase } from '@/data/database';
import {
  withKeyedDatabaseAccess,
  withKeyedTransaction,
} from '@/data/keyedDatabaseAccess';
import { buildWorkEntryHistorySqlQuery } from '@/data/queries/workEntryHistoryQuery';
import {
  type JoinedWorkEntryRow,
  mapJoinedWorkEntryRows,
} from '@/data/repositories/workEntryRowMapper';
import { findWorkEntryDetail } from '@/data/repositories/workEntryDetailQuery';
import {
  assertWorkEntryWriteInput,
  dedupeWorkEntrySkills,
  insertWorkEntryEvidence,
  insertWorkEntrySkills,
  replaceWorkEntryEvidence,
  replaceWorkEntrySkills,
} from '@/data/repositories/workEntryWriteHelpers';
import type {
  WorkEntryHistoryCursor,
  WorkEntryHistoryPage,
  WorkEntryHistoryQuery,
} from '@/domain/entry/history';
import type {
  CreateWorkEntry,
  UpdateWorkEntry,
  WorkEntry,
  WorkEntryDetail,
} from '@/domain/entry/model';
import type { WorkEntryRepository } from '@/domain/entry/repository';

const ACTIVE_DRAFT_ID = 1;

export class SQLiteWorkEntryRepository implements WorkEntryRepository {
  async findById(id: string): Promise<WorkEntryDetail | null> {
    const db = await getDatabase();

    return withKeyedDatabaseAccess(() => findWorkEntryDetail(db, id));
  }

  async findRecent(limit: number): Promise<WorkEntry[]> {
    if (!Number.isInteger(limit) || limit < 0) {
      throw new Error(
        'Recent work entry limit must be a non-negative integer.',
      );
    }

    if (limit === 0) {
      return [];
    }

    const db = await getDatabase();

    return withKeyedDatabaseAccess(async () => {
      const rows = await db.getAllAsync<JoinedWorkEntryRow>(
        `
          WITH recent_entries AS (
            SELECT
              id,
              type,
              title,
              raw_note,
              impact_statement,
              occurred_at,
              outcome_type,
              status,
              work_area_id,
              excluded_from_exports,
              created_at,
              updated_at
            FROM work_entries
            ORDER BY
              occurred_at DESC,
              created_at DESC,
              id DESC
            LIMIT $limit
          )
          SELECT
            recent_entries.id,
            recent_entries.type,
            recent_entries.title,
            recent_entries.raw_note,
            recent_entries.impact_statement,
            recent_entries.occurred_at,
            recent_entries.outcome_type,
            recent_entries.status,
            recent_entries.work_area_id,
            recent_entries.excluded_from_exports,
            recent_entries.created_at,
            recent_entries.updated_at,
            evidence.type AS evidence_type,
            evidence.text_value AS evidence_text_value
          FROM recent_entries
          LEFT JOIN evidence
            ON evidence.entry_id = recent_entries.id
          ORDER BY
            recent_entries.occurred_at DESC,
            recent_entries.created_at DESC,
            recent_entries.id DESC,
            evidence.created_at ASC
        `,
        { $limit: limit },
      );

      return mapJoinedWorkEntryRows(rows);
    });
  }

  async findHistory(
    query: WorkEntryHistoryQuery,
  ): Promise<WorkEntryHistoryPage> {
    const historyQuery = buildWorkEntryHistorySqlQuery(query);

    if (historyQuery.kind === 'empty') {
      return { entries: [], nextCursor: null };
    }

    const db = await getDatabase();

    return withKeyedDatabaseAccess(async () => {
      const rows = await db.getAllAsync<JoinedWorkEntryRow>(
        historyQuery.sql,
        historyQuery.parameters,
      );

      const matchingEntries = mapJoinedWorkEntryRows(rows);
      const hasMore = matchingEntries.length > query.limit;
      const entries = matchingEntries.slice(0, query.limit);
      const lastEntry = entries.at(-1);

      return {
        entries,
        nextCursor:
          hasMore && lastEntry ? createHistoryCursor(lastEntry) : null,
      };
    });
  }

  async countSince(occurredAtInclusive: string): Promise<number> {
    if (!isCanonicalIsoTimestamp(occurredAtInclusive)) {
      throw new Error('Work entry count boundary must be an ISO timestamp.');
    }

    const db = await getDatabase();

    return withKeyedDatabaseAccess(async () => {
      const row = await db.getFirstAsync<{ count: number }>(
        `
          SELECT COUNT(*) AS count
          FROM work_entries
          WHERE occurred_at >= $occurredAtInclusive
        `,
        { $occurredAtInclusive: occurredAtInclusive },
      );

      if (!row || !Number.isInteger(row.count) || row.count < 0) {
        throw new Error('Stored work entry count is invalid.');
      }

      return row.count;
    });
  }

  async commit(input: CreateWorkEntry): Promise<WorkEntry> {
    assertWorkEntryWriteInput(input);

    const db = await getDatabase();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();
    const uniqueSkills = dedupeWorkEntrySkills(input.skills);

    await withKeyedTransaction(db, async (transaction) => {
      await transaction.runAsync(
        `
          INSERT INTO work_entries (
            id,
            type,
            title,
            raw_note,
            impact_statement,
            impact_statement_source,
            occurred_at,
            outcome_type,
            status,
            work_area_id,
            excluded_from_exports,
            created_at,
            updated_at
          )
          VALUES (
            $id,
            $type,
            $title,
            $rawNote,
            $impactStatement,
            $impactStatementSource,
            $occurredAt,
            $outcomeType,
            $status,
            $workAreaId,
            $excludedFromExports,
            $createdAt,
            $updatedAt
          )
        `,
        {
          $id: id,
          $type: input.type,
          $title: input.title,
          $rawNote: input.rawNote,
          $impactStatement: input.impactStatement,
          $impactStatementSource: input.impactStatementSource,
          $occurredAt: input.occurredAt,
          $outcomeType: input.outcomeType,
          $status: input.status,
          $workAreaId: input.workAreaId,
          $excludedFromExports: input.excludedFromExports ? 1 : 0,
          $createdAt: now,
          $updatedAt: now,
        },
      );

      await insertWorkEntryEvidence(transaction, id, input.evidence, now);
      await insertWorkEntrySkills(transaction, id, uniqueSkills);

      await transaction.runAsync(
        'DELETE FROM active_work_entry_draft WHERE id = $activeDraftId',
        { $activeDraftId: ACTIVE_DRAFT_ID },
      );
    });

    return {
      id,
      type: input.type,
      title: input.title,
      rawNote: input.rawNote,
      impactStatement: input.impactStatement,
      occurredAt: input.occurredAt,
      outcomeType: input.outcomeType,
      status: input.status,
      workAreaId: input.workAreaId,
      evidence: input.evidence,
      excludedFromExports: input.excludedFromExports,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(id: string, input: UpdateWorkEntry): Promise<WorkEntryDetail> {
    assertWorkEntryWriteInput(input);

    const db = await getDatabase();
    const now = new Date().toISOString();
    const uniqueSkills = dedupeWorkEntrySkills(input.skills);

    return withKeyedTransaction(db, async (transaction) => {
      const result = await transaction.runAsync(
        `
          UPDATE work_entries
          SET
            type = $type,
            title = $title,
            raw_note = $rawNote,
            impact_statement = $impactStatement,
            impact_statement_source = $impactStatementSource,
            occurred_at = $occurredAt,
            outcome_type = $outcomeType,
            status = $status,
            work_area_id = $workAreaId,
            excluded_from_exports = $excludedFromExports,
            updated_at = $updatedAt
          WHERE id = $id
        `,
        {
          $id: id,
          $type: input.type,
          $title: input.title,
          $rawNote: input.rawNote,
          $impactStatement: input.impactStatement,
          $impactStatementSource: input.impactStatementSource,
          $occurredAt: input.occurredAt,
          $outcomeType: input.outcomeType,
          $status: input.status,
          $workAreaId: input.workAreaId,
          $excludedFromExports: input.excludedFromExports ? 1 : 0,
          $updatedAt: now,
        },
      );

      if (result.changes !== 1) {
        throw new Error('Work entry to update was not found.');
      }

      await replaceWorkEntryEvidence(transaction, id, input.evidence, now);
      await replaceWorkEntrySkills(transaction, id, uniqueSkills);

      const updatedEntry = await findWorkEntryDetail(transaction, id);
      if (!updatedEntry) {
        throw new Error('Updated work entry could not be reloaded.');
      }

      return updatedEntry;
    });
  }
}

function createHistoryCursor(entry: WorkEntry): WorkEntryHistoryCursor {
  return {
    occurredAt: entry.occurredAt,
    createdAt: entry.createdAt,
    id: entry.id,
  };
}
