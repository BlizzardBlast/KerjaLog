import * as Crypto from 'expo-crypto';
import { getDatabase } from '@/data/database';
import { withKeyedTransaction } from '@/data/keyedTransaction';
import type { CreateWorkEntry, WorkEntry } from '@/domain/entry/model';
import type { WorkEntryRepository } from '@/domain/entry/repository';
import {
  type JoinedWorkEntryRow,
  mapJoinedWorkEntryRows,
} from '@/data/repositories/workEntryRowMapper';

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

    return mapJoinedWorkEntryRows(rows)[0] ?? null;
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

    return mapJoinedWorkEntryRows(rows);
  }

  async create(input: CreateWorkEntry): Promise<WorkEntry> {
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
    });

    return {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }
}
