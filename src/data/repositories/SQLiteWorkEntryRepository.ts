import * as Crypto from 'expo-crypto';
import { getDatabase } from '@/data/database';
import {
  type CreateWorkEntry,
  ENTRY_STATUSES,
  ENTRY_TYPES,
  EVIDENCE_TYPES,
  type EvidenceType,
  OUTCOME_TYPES,
  type WorkEntry,
} from '@/domain/entry/model';
import type { WorkEntryRepository } from '@/domain/entry/repository';

type JoinedWorkEntryRow = {
  id: string;
  type: string;
  title: string;
  raw_note: string;
  impact_statement: string | null;
  occurred_at: string;
  outcome_type: string | null;
  status: string;
  excluded_from_exports: number;
  created_at: string;
  updated_at: string;
  evidence_type: string | null;
  evidence_text_value: string | null;
};

export class SQLiteWorkEntryRepository implements WorkEntryRepository {
  async findById(id: string): Promise<WorkEntry | null> {
    const db = await getDatabase();

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

    return mapJoinedRows(rows)[0] ?? null;
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
            created_at DESC
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
          evidence.created_at ASC
      `,
      {
        $limit: limit,
      },
    );

    return mapJoinedRows(rows);
  }

  async create(input: CreateWorkEntry): Promise<WorkEntry> {
    const db = await getDatabase();

    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    await db.withExclusiveTransactionAsync(async (transaction) => {
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
    });

    return {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }
}

function mapJoinedRows(rows: JoinedWorkEntryRow[]): WorkEntry[] {
  const entries = new Map<
    string,
    {
      entry: WorkEntry;
      evidenceTypes: EvidenceType[];
      evidenceDetail: string | null;
    }
  >();

  for (const row of rows) {
    const id = expectString(row.id, 'work entry id');
    const type = expectOneOf(row.type, ENTRY_TYPES, 'work entry type');
    const title = expectString(row.title, 'work entry title');
    const rawNote = expectString(row.raw_note, 'work entry raw note');
    const impactStatement = expectNullableString(
      row.impact_statement,
      'work entry impact statement',
    );
    const occurredAt = expectString(row.occurred_at, 'work entry occurred at');
    const outcomeType =
      row.outcome_type === null
        ? null
        : expectOneOf(
            row.outcome_type,
            OUTCOME_TYPES,
            'work entry outcome type',
          );
    const status = expectOneOf(row.status, ENTRY_STATUSES, 'work entry status');
    const excludedFromExports = expectBooleanInteger(
      row.excluded_from_exports,
      'work entry excluded from exports',
    );
    const createdAt = expectString(row.created_at, 'work entry created at');
    const updatedAt = expectString(row.updated_at, 'work entry updated at');
    const evidenceType =
      row.evidence_type === null
        ? null
        : expectOneOf(row.evidence_type, EVIDENCE_TYPES, 'evidence type');
    const evidenceTextValue = expectNullableString(
      row.evidence_text_value,
      'evidence text value',
    );

    let accumulated = entries.get(id);

    if (!accumulated) {
      accumulated = {
        entry: {
          id,
          type,
          title,
          rawNote,
          impactStatement,
          occurredAt,
          outcomeType,
          status,
          evidence: null,
          excludedFromExports,
          createdAt,
          updatedAt,
        },
        evidenceTypes: [],
        evidenceDetail: null,
      };

      entries.set(id, accumulated);
    }

    if (
      evidenceType !== null &&
      !accumulated.evidenceTypes.includes(evidenceType)
    ) {
      accumulated.evidenceTypes.push(evidenceType);
    }

    if (evidenceTextValue !== null) {
      if (
        accumulated.evidenceDetail !== null &&
        accumulated.evidenceDetail !== evidenceTextValue
      ) {
        throw new Error(
          `Stored evidence for work entry ${id} is inconsistent.`,
        );
      }

      accumulated.evidenceDetail = evidenceTextValue;
    }
  }

  return [...entries.values()].map(
    ({ entry, evidenceTypes, evidenceDetail }) => ({
      ...entry,
      evidence:
        evidenceTypes.length > 0
          ? {
              types: evidenceTypes,
              detail: evidenceDetail ?? '',
            }
          : null,
    }),
  );
}

function expectString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Stored ${field} is invalid.`);
  }

  return value;
}

function expectNullableString(value: unknown, field: string): string | null {
  if (value === null) {
    return null;
  }

  return expectString(value, field);
}

function expectBooleanInteger(value: unknown, field: string): boolean {
  if (value === 0) {
    return false;
  }

  if (value === 1) {
    return true;
  }

  throw new Error(`Stored ${field} is invalid.`);
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
