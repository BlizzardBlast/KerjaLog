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
  test('creates the complete v1 schema before advancing user_version', async () => {
    const database = createDatabase(0);

    await migrateDatabase(database.db);

    expect(database.getFirstAsync).toHaveBeenCalledWith('PRAGMA user_version');
    expect(database.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(database.execAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('CREATE TABLE work_entries'),
    );
    expect(database.execAsync.mock.calls[0]?.[0]).toEqual(
      expect.stringContaining('CREATE TABLE active_work_entry_draft'),
    );
    expect(database.execAsync.mock.calls[0]?.[0]).toEqual(
      expect.stringContaining(
        'CREATE VIRTUAL TABLE work_entry_history_fts USING fts5',
      ),
    );
    expect(database.execAsync.mock.calls[0]?.[0]).toEqual(
      expect.stringContaining('UNIQUE (entry_id, type)'),
    );
    expect(database.execAsync.mock.calls[0]?.[0]).toEqual(
      expect.stringContaining('excluded_from_exports IN (0, 1)'),
    );
    expect(database.execAsync).toHaveBeenNthCalledWith(
      2,
      'PRAGMA user_version = 1',
    );
  });

  test('does not rerun migrations when the database is current', async () => {
    const database = createDatabase(1);

    await migrateDatabase(database.db);

    expect(database.withTransactionAsync).not.toHaveBeenCalled();
    expect(database.execAsync).not.toHaveBeenCalled();
  });

  test('rejects a database schema newer than this app understands', async () => {
    const database = createDatabase(2);

    await expect(migrateDatabase(database.db)).rejects.toThrow(
      'Database schema version 2 is newer than supported version 1.',
    );

    expect(database.withTransactionAsync).not.toHaveBeenCalled();
    expect(database.execAsync).not.toHaveBeenCalled();
  });

  test('does not advance user_version when schema creation fails', async () => {
    const database = createDatabase(0);
    database.execAsync.mockRejectedValueOnce(new Error('schema creation failed'));

    await expect(migrateDatabase(database.db)).rejects.toThrow(
      'schema creation failed',
    );

    expect(database.execAsync).toHaveBeenCalledTimes(1);
  });
});
