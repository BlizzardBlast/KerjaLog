import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from '@/data/database';
import {
  withKeyedDatabaseAccess,
  withKeyedTransaction,
} from '@/data/keyedDatabaseAccess';
import { isCanonicalIsoTimestamp } from '@/domain/entry/timestamp';
import type { WorkArea } from '@/domain/work-area/model';
import type { WorkAreaRepository } from '@/domain/work-area/repository';
import {
  createWorkAreaNameKey,
  normalizeWorkAreaName,
} from '@/domain/work-area/validation';

type WorkAreaRow = {
  id: unknown;
  name: unknown;
  archived_at: unknown;
  created_at: unknown;
  updated_at: unknown;
};

export class SQLiteWorkAreaRepository implements WorkAreaRepository {
  async listActive(): Promise<WorkArea[]> {
    return this.list('WHERE archived_at IS NULL');
  }

  async listAll(): Promise<WorkArea[]> {
    return this.list('');
  }

  async create(name: string): Promise<WorkArea> {
    const normalizedName = normalizeWorkAreaName(name);
    const nameKey = createWorkAreaNameKey(normalizedName);
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();
    const db = await getDatabase();

    await withKeyedDatabaseAccess(async () => {
      await db.runAsync(
        `INSERT INTO work_areas (
          id, name, name_key, archived_at, created_at, updated_at
        ) VALUES (
          $id, $name, $nameKey, NULL, $createdAt, $updatedAt
        )`,
        {
          $id: id,
          $name: normalizedName,
          $nameKey: nameKey,
          $createdAt: now,
          $updatedAt: now,
        },
      );
    });

    return {
      id,
      name: normalizedName,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  async rename(id: string, name: string): Promise<WorkArea> {
    assertWorkAreaId(id);
    const normalizedName = normalizeWorkAreaName(name);
    const nameKey = createWorkAreaNameKey(normalizedName);
    const updatedAt = new Date().toISOString();
    const db = await getDatabase();

    return withKeyedTransaction(db, async (transaction) => {
      const result = await transaction.runAsync(
        `UPDATE work_areas
         SET name = $name, name_key = $nameKey, updated_at = $updatedAt
         WHERE id = $id AND archived_at IS NULL`,
        {
          $id: id,
          $name: normalizedName,
          $nameKey: nameKey,
          $updatedAt: updatedAt,
        },
      );

      if (result.changes !== 1) {
        throw new Error('Active work area to rename was not found.');
      }

      const row = await transaction.getFirstAsync<WorkAreaRow>(
        `SELECT id, name, archived_at, created_at, updated_at
         FROM work_areas
         WHERE id = $id`,
        { $id: id },
      );

      if (!row) {
        throw new Error('Renamed work area could not be reloaded.');
      }

      return mapWorkAreaRow(row);
    });
  }

  async archive(id: string): Promise<void> {
    assertWorkAreaId(id);
    const archivedAt = new Date().toISOString();
    const db = await getDatabase();

    await withKeyedDatabaseAccess(async () => {
      const result = await db.runAsync(
        `UPDATE work_areas
         SET archived_at = $archivedAt, updated_at = $archivedAt
         WHERE id = $id AND archived_at IS NULL`,
        { $id: id, $archivedAt: archivedAt },
      );

      if (result.changes !== 1) {
        throw new Error('Active work area to archive was not found.');
      }
    });
  }

  private async list(whereSql: string): Promise<WorkArea[]> {
    const db = await getDatabase();

    return withKeyedDatabaseAccess(async () => {
      const rows = await db.getAllAsync<WorkAreaRow>(
        `SELECT id, name, archived_at, created_at, updated_at
         FROM work_areas
         ${whereSql}
         ORDER BY name COLLATE NOCASE ASC, created_at ASC`,
      );

      return rows.map(mapWorkAreaRow);
    });
  }
}

function assertWorkAreaId(id: string): void {
  if (!id.trim()) {
    throw new Error('Work area id is required.');
  }
}

function mapWorkAreaRow(row: WorkAreaRow): WorkArea {
  const id = expectNonEmptyString(row.id, 'work area id');
  const name = expectNonEmptyString(row.name, 'work area name');
  const archivedAt =
    row.archived_at === null
      ? null
      : expectIsoTimestamp(row.archived_at, 'work area archived at');

  return {
    id,
    name,
    archivedAt,
    createdAt: expectIsoTimestamp(row.created_at, 'work area created at'),
    updatedAt: expectIsoTimestamp(row.updated_at, 'work area updated at'),
  };
}

function expectNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Stored ${field} is invalid.`);
  }

  return value;
}

function expectIsoTimestamp(value: unknown, field: string): string {
  if (!isCanonicalIsoTimestamp(value)) {
    throw new Error(`Stored ${field} is invalid.`);
  }

  return value;
}
