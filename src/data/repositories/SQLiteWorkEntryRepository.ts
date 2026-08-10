import * as Crypto from 'expo-crypto';
import { getDatabase } from '@/data/database';
import type {
  CreateWorkEntry,
  EntryStatus,
  EntryType,
  EvidenceType,
  OutcomeType,
  WorkEntry,
} from '@/domain/entry/model';
import type { WorkEntryRepository } from '@/domain/entry/repository';

type WorkEntryRow = {
  id: string;
  type: EntryType;
  title: string;
  raw_note: string;
  impact_statement: string | null;
  occurred_at: string;
  outcome_type: OutcomeType | null;
  status: EntryStatus;
  excluded_from_exports: number;
  created_at: string;
  updated_at: string;
};

type JoinedWorkEntryRow = WorkEntryRow & {
  evidence_type: EvidenceType | null;
  evidence_text_value: string | null;
};

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
    let accumulated = entries.get(row.id);

    if (!accumulated) {
      accumulated = {
        entry: {
          id: row.id,
          type: row.type,
          title: row.title,
          rawNote: row.raw_note,
          impactStatement: row.impact_statement,
          occurredAt: row.occurred_at,
          outcomeType: row.outcome_type,
          status: row.status,
          evidence: null,
          excludedFromExports: row.excluded_from_exports === 1,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
        evidenceTypes: [],
        evidenceDetail: null,
      };

      entries.set(row.id, accumulated);
    }

    if (
      row.evidence_type !== null &&
      !accumulated.evidenceTypes.includes(row.evidence_type)
    ) {
      accumulated.evidenceTypes.push(row.evidence_type);
    }

    if (
      accumulated.evidenceDetail === null &&
      row.evidence_text_value !== null
    ) {
      accumulated.evidenceDetail = row.evidence_text_value;
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
