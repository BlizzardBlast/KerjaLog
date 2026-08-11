import * as SQLite from 'expo-sqlite';
import { getDatabase } from '@/data/database';
import { migrateDatabase } from '@/data/migrations/migrateDatabase';
import {
  generateDatabaseKey,
  getStoredDatabaseKey,
  storeDatabaseKey,
} from '@/platform/secure-storage/databaseKey';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
  deleteDatabaseAsync: jest.fn(),
}));

jest.mock('@/data/migrations/migrateDatabase', () => ({
  migrateDatabase: jest.fn(),
}));

jest.mock('@/platform/secure-storage/databaseKey', () => ({
  generateDatabaseKey: jest.fn(),
  getStoredDatabaseKey: jest.fn(),
  storeDatabaseKey: jest.fn(),
}));

const openDatabaseAsyncMock = jest.mocked(SQLite.openDatabaseAsync);
const deleteDatabaseAsyncMock = jest.mocked(SQLite.deleteDatabaseAsync);
const migrateDatabaseMock = jest.mocked(migrateDatabase);
const generateDatabaseKeyMock = jest.mocked(generateDatabaseKey);
const getStoredDatabaseKeyMock = jest.mocked(getStoredDatabaseKey);
const storeDatabaseKeyMock = jest.mocked(storeDatabaseKey);

test('does not rotate the key when an existing encrypted database cannot be opened', async () => {
  const generatedKey = 'cd'.repeat(32);
  const execAsync = jest.fn().mockResolvedValue(undefined);
  const getFirstAsync = jest
    .fn()
    .mockResolvedValueOnce({ cipher_version: '4.6.1' })
    .mockRejectedValueOnce(new Error('file is not a database'));
  const closeAsync = jest.fn().mockResolvedValue(undefined);
  const db = {
    execAsync,
    getFirstAsync,
    closeAsync,
  } as unknown as SQLite.SQLiteDatabase;

  getStoredDatabaseKeyMock.mockResolvedValue(null);
  generateDatabaseKeyMock.mockResolvedValue(generatedKey);
  openDatabaseAsyncMock.mockResolvedValue(db);

  await expect(getDatabase()).rejects.toThrow(
    'An existing encrypted KerjaLog database cannot be opened because its device-bound encryption key is unavailable.',
  );

  expect(execAsync).toHaveBeenCalledWith(`PRAGMA key = '${generatedKey}'`);
  expect(storeDatabaseKeyMock).not.toHaveBeenCalled();
  expect(migrateDatabaseMock).not.toHaveBeenCalled();
  expect(deleteDatabaseAsyncMock).not.toHaveBeenCalled();
  expect(closeAsync).toHaveBeenCalledTimes(1);
});
