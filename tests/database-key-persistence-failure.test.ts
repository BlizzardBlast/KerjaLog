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

jest.mock('@/platform/runtime/encryptedStorageRuntime', () => ({
  assertEncryptedStorageRuntimeSupported: jest.fn(),
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

test('deletes a new encrypted database if its generated key cannot be persisted', async () => {
  const generatedKey = 'ef'.repeat(32);
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

  getStoredDatabaseKeyMock.mockResolvedValue(null);
  generateDatabaseKeyMock.mockResolvedValue(generatedKey);
  storeDatabaseKeyMock.mockRejectedValue(new Error('SecureStore unavailable'));
  openDatabaseAsyncMock.mockResolvedValue(db);
  deleteDatabaseAsyncMock.mockResolvedValue(undefined);

  await expect(getDatabase()).rejects.toThrow('SecureStore unavailable');

  expect(storeDatabaseKeyMock).toHaveBeenCalledWith(generatedKey);
  expect(closeAsync).toHaveBeenCalledTimes(1);
  expect(deleteDatabaseAsyncMock).toHaveBeenCalledWith(
    'kerjalog-encrypted-v1.db',
  );
  expect(migrateDatabaseMock).not.toHaveBeenCalled();
});
