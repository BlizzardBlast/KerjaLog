import * as SQLite from 'expo-sqlite';
import { getDatabase } from '@/data/database';
import { migrateDatabase } from '@/data/migrations/migrateDatabase';
import { getOrCreateDatabaseKey } from '@/platform/secure-storage/databaseKey';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock('@/data/migrations/migrateDatabase', () => ({
  migrateDatabase: jest.fn(),
}));

jest.mock('@/platform/secure-storage/databaseKey', () => ({
  getOrCreateDatabaseKey: jest.fn(),
}));

const openDatabaseAsyncMock = jest.mocked(SQLite.openDatabaseAsync);
const migrateDatabaseMock = jest.mocked(migrateDatabase);
const getOrCreateDatabaseKeyMock = jest.mocked(getOrCreateDatabaseKey);

test('opens an isolated encrypted database and keys it before reading pages', async () => {
  const key = 'ab'.repeat(32);
  const execAsync = jest.fn().mockResolvedValue(undefined);
  const getFirstAsync = jest
    .fn()
    .mockResolvedValueOnce({ cipher_version: '4.6.1' })
    .mockResolvedValueOnce({ count: 0 });
  const closeAsync = jest.fn().mockResolvedValue(undefined);
  const db = {
    execAsync,
    getFirstAsync,
    closeAsync,
  } as unknown as SQLite.SQLiteDatabase;

  getOrCreateDatabaseKeyMock.mockResolvedValue(key);
  openDatabaseAsyncMock.mockResolvedValue(db);
  migrateDatabaseMock.mockResolvedValue(undefined);

  await expect(getDatabase()).resolves.toBe(db);

  expect(openDatabaseAsyncMock).toHaveBeenCalledWith(
    'kerjalog-encrypted-v1.db',
    { useNewConnection: true },
  );
  expect(execAsync).toHaveBeenNthCalledWith(1, `PRAGMA key = '${key}'`);
  expect(getFirstAsync).toHaveBeenNthCalledWith(1, 'PRAGMA cipher_version');
  expect(getFirstAsync).toHaveBeenNthCalledWith(
    2,
    'SELECT count(*) AS count FROM sqlite_master',
  );
  expect(execAsync).toHaveBeenNthCalledWith(2, 'PRAGMA foreign_keys = ON');
  expect(execAsync).toHaveBeenNthCalledWith(3, 'PRAGMA journal_mode = WAL');
  expect(migrateDatabaseMock).toHaveBeenCalledWith(db);
  expect(closeAsync).not.toHaveBeenCalled();
});
