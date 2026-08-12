import * as Crypto from 'expo-crypto';
import { getDatabase } from '@/data/database';
import {
  withKeyedDatabaseAccess,
  withKeyedTransaction,
} from '@/data/keyedDatabaseAccess';
import {
  type JoinedWorkEntryRow,
  mapJoinedWorkEntryRows,
} from '@/data/repositories/workEntryRowMapper';
import {
  HISTORY_PAGE_MAX_SIZE,
  HISTORY_SEARCH_MAX_LENGTH,
  HISTORY_SEARCH_MAX_TERMS,
  type WorkEntryHistoryCursor,
  type WorkEntryHistoryPage,
  type WorkEntryHistoryQuery,
} from '@/domain/entry/history';
import {
  type CreateWorkEntry,
  ENTRY_TYPES,
  type WorkEntry,
} from '@/domain/entry/model';
import type { WorkEntryRepository } from '@/domain/entry/repository';
import { isCanonicalIsoTimestamp } from '@/domain/entry/timestamp';

const ACTIVE_DRAFT_ID = 1;

export class SQLiteWorkEntryRepository implements WorkEntryRepository {
  async findById(id: string): Promise<WorkEntry | null> {
    const db = await getDatabase();

    return withKeyedDatabaseAccess(async () => {
      const rows = await db.getAllAsync<JoinedWorkEntryRow>(
        `
          SELECT
            work_entries.id,
            work_entries.type,
            work_entries.title,
            work_entries.raw_note,
            work_entries.impact_statement,
            work_entries.occurred_at,
            work_entries.outcome_type,
            work_entries.status,
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
        {
          $id: id,
        },
      );

      return mapJoinedWorkEntryRows(rows)[0] ?? null;
    });
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
        {
          $limit: limit,
        },
      );

      return mapJoinedWorkEntryRows(rows);
    });
  }

  async findHistory(
    query: WorkEntryHistoryQuery,
  ): Promise<WorkEntryHistoryPage> {
    validateHistoryQuery(query);

    const trimmedSearchText = query.searchText.trim();
    const searchQuery = buildFtsSearchQuery(trimmedSearchText);

    if (trimmedSearchText && searchQuery === null) {
      return { entries: [], nextCursor: null };
    }

    const whereClauses: string[] = [];
    const parameters: Record<string, string | number | null> = {
      $limitPlusOne: query.limit + 1,
    };

    if (searchQuery !== null) {
      whereClauses.push(`
        work_entries.id IN (
          SELECT entry_id
          FROM work_entry_history_fts
          WHERE work_entry_history_fts MATCH $searchQuery
        )
      `);
      parameters.$searchQuery = searchQuery;
    }

    if (query.filters.entryType !== null) {
      whereClauses.push('work_entries.type = $entryType');
      parameters.$entryType = query.filters.entryType;
    }

    if (query.filters.hasEvidence) {
      whereClauses.push(`
        EXISTS (
          SELECT 1
          FROM evidence history_evidence
          WHERE history_evidence.entry_id = work_entries.id
        )
      `);
    }

    if (query.filters.reviewReadyOnly) {
      whereClauses.push("work_entries.status = 'review_ready'");
    }

    if (query.cursor !== null) {
      whereClauses.push(`
        (
          work_entries.occurred_at < $cursorOccurredAt
          OR (
            work_entries.occurred_at = $cursorOccurredAt
            AND work_entries.created_at < $cursorCreatedAt
          )
          OR (
            work_entries.occurred_at = $cursorOccurredAt
            AND work_entries.created_at = $cursorCreatedAt
            AND work_entries.id < $cursorId
          )
        )
      `);
      parameters.$cursorOccurredAt = query.cursor.occurredAt;
      parameters.$cursorCreatedAt = query.cursor.createdAt;
      parameters.$cursorId = query.cursor.id;
    }

    const whereSql =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const db = await getDatabase();

    return withKeyedDatabaseAccess(async () => {
      const rows = await db.getAllAsync<JoinedWorkEntryRow>(
        `
          WITH matching_entries AS (
            SELECT
              work_entries.id,
              work_entries.type,
              work_entries.title,
              work_entries.raw_note,
              work_entries.impact_statement,
              work_entries.occurred_at,
              work_entries.outcome_type,
              work_entries.status,
              work_entries.excluded_from_exports,
              work_entries.created_at,
              work_entries.updated_at
            FROM work_entries
            ${whereSql}
            ORDER BY
              work_entries.occurred_at DESC,
              work_entries.created_at DESC,
              work_entries.id DESC
            LIMIT $limitPlusOne
          )
          SELECT
            matching_entries.id,
            matching_entries.type,
            matching_entries.title,
            matching_entries.raw_note,
            matching_entries.impact_statement,
            matching_entries.occurred_at,
            matching_entries.outcome_type,
            matching_entries.status,
            matching_entries.excluded_from_exports,
            matching_entries.created_at,
            matching_entries.updated_at,
            evidence.type AS evidence_type,
            evidence.text_value AS evidence_text_value
          FROM matching_entries
          LEFT JOIN evidence
            ON evidence.entry_id = matching_entries.id
          ORDER BY
            matching_entries.occurred_at DESC,
            matching_entries.created_at DESC,
            matching_entries.id DESC,
            evidence.created_at ASC
        `,
        parameters,
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
        {
          $occurredAtInclusive: occurredAtInclusive,
        },
      );

      if (!row || !Number.isInteger(row.count) || row.count < 0) {
        throw new Error('Stored work entry count is invalid.');
      }

      return row.count;
    });
  }

  async commit(input: CreateWorkEntry): Promise<WorkEntry> {
    if (!isCanonicalIsoTimestamp(input.occurredAt)) {
      throw new Error(
        'Work entry occurred at must be a canonical ISO timestamp.',
      );
    }

    const db = await getDatabase();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    await withKeyedTransaction(db, async (transaction) => {
      await transaction.runAsync(
        `
          INSERT INTO work_entries (
            id,
            type,
            title,
            raw_note,
            impact_statement,
            occurred_at,
            outcome_type,
            status,
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
            $occurredAt,
            $outcomeType,
            $status,
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
          $occurredAt: input.occurredAt,
          $outcomeType: input.outcomeType,
          $status: input.status,
          $excludedFromExports: input.excludedFromExports ? 1 : 0,
          $createdAt: now,
          $updatedAt: now,
        },
      );

      for (const type of input.evidence?.types ?? []) {
        await transaction.runAsync(
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
            $entryId: id,
            $type: type,
            $textValue: input.evidence?.detail ?? null,
            $createdAt: now,
          },
        );
      }

      // Consuming the active draft is part of the same durable commit as the
      // new entry. A process death can therefore never leave both a committed
      // entry and a recoverable draft that would save the same work twice.
      await transaction.runAsync(
        'DELETE FROM active_work_entry_draft WHERE id = $activeDraftId',
        { $activeDraftId: ACTIVE_DRAFT_ID },
      );
    });

    return {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }
}

function validateHistoryQuery(query: WorkEntryHistoryQuery): void {
  if (
    typeof query.searchText !== 'string' ||
    query.searchText.length > HISTORY_SEARCH_MAX_LENGTH
  ) {
    throw new Error(
      `History search text must be at most ${HISTORY_SEARCH_MAX_LENGTH} characters.`,
    );
  }

  const { entryType, hasEvidence, reviewReadyOnly } = query.filters;

  if (entryType !== null && !ENTRY_TYPES.includes(entryType)) {
    throw new Error('History entry type filter is invalid.');
  }

  if (
    typeof hasEvidence !== 'boolean' ||
    typeof reviewReadyOnly !== 'boolean'
  ) {
    throw new Error('History boolean filters are invalid.');
  }

  if (
    !Number.isInteger(query.limit) ||
    query.limit <= 0 ||
    query.limit > HISTORY_PAGE_MAX_SIZE
  ) {
    throw new Error(
      `History page size must be an integer between 1 and ${HISTORY_PAGE_MAX_SIZE}.`,
    );
  }

  if (query.cursor !== null) {
    validateHistoryCursor(query.cursor);
  }
}

function validateHistoryCursor(cursor: WorkEntryHistoryCursor): void {
  if (
    !isCanonicalIsoTimestamp(cursor.occurredAt) ||
    !isCanonicalIsoTimestamp(cursor.createdAt) ||
    !cursor.id.trim()
  ) {
    throw new Error('History cursor is invalid.');
  }
}

export function buildFtsSearchQuery(searchText: string): string | null {
  const terms = searchText.normalize('NFKC').match(/[\p{L}\p{N}]+/gu) ?? [];
  const boundedTerms = terms.slice(0, HISTORY_SEARCH_MAX_TERMS);

  if (boundedTerms.length === 0) {
    return null;
  }

  return boundedTerms.map((term) => `"${term}"*`).join(' AND ');
}

function createHistoryCursor(entry: WorkEntry): WorkEntryHistoryCursor {
  return {
    occurredAt: entry.occurredAt,
    createdAt: entry.createdAt,
    id: entry.id,
  };
}
