import type { SQLiteDatabase } from 'expo-sqlite';
import { migrateDatabase } from '@/data/migrations/migrateDatabase';

function createDatabase(version: number) {
  const db = {
    execAsync: jest.fn().mockResolvedValue(undefined),
    getFirstAsync: jest.fn().mockResolvedValue({ user_version: version }),
    withTransactionAsync: jest.fn(async (operation: () => Promise<void>) => {
      await operation();
    }),
  };

  return {
    db: db as unknown as SQLiteDatabase,
    execAsync: db.execAsync,
    getFirstAsync: db.getFirstAsync,
    withTransactionAsync: db.withTransactionAsync,
  };
}

describe('migrateDatabase', () => {
  test('runs v1 through v4 schemas before advancing user_version', async () => {
    const database = createDatabase(0);

    await migrateDatabase(database.db);

    expect(database.getFirstAsync).toHaveBeenCalledWith('PRAGMA user_version');
    expect(database.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(database.execAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('CREATE TABLE work_entries'),
    );
    expect(database.execAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('CREATE TABLE work_entries_v2'),
    );
    expect(database.execAsync.mock.calls[1]?.[0]).toEqual(
      expect.stringContaining('UNIQUE (entry_id, type)'),
    );
    expect(database.execAsync.mock.calls[1]?.[0]).toEqual(
      expect.stringContaining('excluded_from_exports IN (0, 1)'),
    );
    expect(database.execAsync).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('CREATE TABLE active_work_entry_draft'),
    );
    expect(database.execAsync.mock.calls[2]?.[0]).toEqual(
      expect.stringContaining('CHECK(id = 1)'),
    );
    expect(database.execAsync).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining(
        'CREATE VIRTUAL TABLE work_entry_history_fts USING fts5',
      ),
    );
    expect(database.execAsync.mock.calls[3]?.[0]).toEqual(
      expect.stringContaining(
        'CREATE TRIGGER work_entry_history_evidence_after_update',
      ),
    );
    expect(database.execAsync).toHaveBeenNthCalledWith(
      5,
      'PRAGMA user_version = 4',
    );
  });

  test('upgrades an existing v1 database through v2, v3, and v4', async () => {
    const database = createDatabase(1);

    await migrateDatabase(database.db);

    expect(database.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(database.execAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('CREATE TABLE work_entries_v2'),
    );
    expect(database.execAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('CREATE TABLE active_work_entry_draft'),
    );
    expect(database.execAsync).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining(
        'CREATE VIRTUAL TABLE work_entry_history_fts USING fts5',
      ),
    );
    expect(database.execAsync).toHaveBeenNthCalledWith(
      4,
      'PRAGMA user_version = 4',
    );
  });

  test('upgrades an existing v2 database through draft and history migrations', async () => {
    const database = createDatabase(2);

    await migrateDatabase(database.db);

    expect(database.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(database.execAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('CREATE TABLE active_work_entry_draft'),
    );
    expect(database.execAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(
        'CREATE VIRTUAL TABLE work_entry_history_fts USING fts5',
      ),
    );
    expect(database.execAsync).toHaveBeenNthCalledWith(
      3,
      'PRAGMA user_version = 4',
    );
  });

  test('upgrades an existing v3 database through only the history migration', async () => {
    const database = createDatabase(3);

    await migrateDatabase(database.db);

    expect(database.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(database.execAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(
        'CREATE VIRTUAL TABLE work_entry_history_fts USING fts5',
      ),
    );
    expect(database.execAsync).toHaveBeenNthCalledWith(
      2,
      'PRAGMA user_version = 4',
    );
  });

  test('does not rerun migrations when the database is current', async () => {
    const database = createDatabase(4);

    await migrateDatabase(database.db);

    expect(database.withTransactionAsync).not.toHaveBeenCalled();
    expect(database.execAsync).not.toHaveBeenCalled();
  });

  test('rejects a database schema newer than this app understands', async () => {
    const database = createDatabase(5);

    await expect(migrateDatabase(database.db)).rejects.toThrow(
      'Database schema version 5 is newer than supported version 4.',
    );

    expect(database.withTransactionAsync).not.toHaveBeenCalled();
    expect(database.execAsync).not.toHaveBeenCalled();
  });

  test('does not advance user_version when a schema migration fails', async () => {
    const database = createDatabase(3);
    database.execAsync.mockRejectedValueOnce(
      new Error('schema migration failed'),
    );

    await expect(migrateDatabase(database.db)).rejects.toThrow(
      'schema migration failed',
    );

    expect(database.execAsync).toHaveBeenCalledTimes(1);
  });
});
