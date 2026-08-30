import {
  HISTORY_SEARCH_MAX_LENGTH,
  type WorkEntryHistoryCursor,
  type WorkEntryHistoryQuery,
} from '@/domain/entry/history';
import { ENTRY_TYPES } from '@/domain/entry/model';
import { isCanonicalIsoTimestamp } from '@/domain/entry/timestamp';

const HISTORY_PAGE_MAX_SIZE = 100;
const HISTORY_SEARCH_MAX_TERMS = 16;

type WorkEntryHistoryQueryParameters = Record<string, string | number | null>;

export type WorkEntryHistorySqlQuery =
  | { kind: 'empty' }
  | {
      kind: 'query';
      sql: string;
      parameters: WorkEntryHistoryQueryParameters;
    };

export function buildWorkEntryHistorySqlQuery(
  query: WorkEntryHistoryQuery,
): WorkEntryHistorySqlQuery {
  validateHistoryQuery(query);

  const trimmedSearchText = query.searchText.trim();
  const searchQuery = buildFtsSearchQuery(trimmedSearchText);

  if (trimmedSearchText && searchQuery === null) {
    return { kind: 'empty' };
  }

  const whereClauses: string[] = [];
  const parameters: WorkEntryHistoryQueryParameters = {
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

  return {
    kind: 'query',
    parameters,
    sql: `
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
  };
}

export function buildFtsSearchQuery(searchText: string): string | null {
  const terms = searchText.normalize('NFKC').match(/[\p{L}\p{N}]+/gu) ?? [];
  const boundedTerms = terms.slice(0, HISTORY_SEARCH_MAX_TERMS);

  if (boundedTerms.length === 0) {
    return null;
  }

  return boundedTerms.map((term) => `"${term}"*`).join(' AND ');
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
    throw new TypeError('History boolean filters are invalid.');
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
