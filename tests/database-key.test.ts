import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import {
  generateDatabaseKey,
  getStoredDatabaseKey,
  storeDatabaseKey,
} from '@/platform/secure-storage/databaseKey';

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
}));

const getRandomBytesAsyncMock = jest.mocked(Crypto.getRandomBytesAsync);
const getItemAsyncMock = jest.mocked(SecureStore.getItemAsync);
const setItemAsyncMock = jest.mocked(SecureStore.setItemAsync);

describe('database key storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns an existing valid database key without rotating it', async () => {
    const storedKey = 'ab'.repeat(32);
    getItemAsyncMock.mockResolvedValue(storedKey);

    await expect(getStoredDatabaseKey()).resolves.toBe(storedKey);

    expect(getRandomBytesAsyncMock).not.toHaveBeenCalled();
    expect(setItemAsyncMock).not.toHaveBeenCalled();
  });

  test('returns null when no database key exists', async () => {
    getItemAsyncMock.mockResolvedValue(null);

    await expect(getStoredDatabaseKey()).resolves.toBeNull();

    expect(getRandomBytesAsyncMock).not.toHaveBeenCalled();
    expect(setItemAsyncMock).not.toHaveBeenCalled();
  });

  test('rejects a corrupt stored key instead of rotating it', async () => {
    getItemAsyncMock.mockResolvedValue('');

    await expect(getStoredDatabaseKey()).rejects.toThrow(
      'Stored database encryption key is invalid.',
    );

    expect(getRandomBytesAsyncMock).not.toHaveBeenCalled();
    expect(setItemAsyncMock).not.toHaveBeenCalled();
  });

  test('generates a 256-bit hexadecimal key without persisting it', async () => {
    getRandomBytesAsyncMock.mockResolvedValue(
      Uint8Array.from({ length: 32 }, (_, index) => index),
    );

    const key = await generateDatabaseKey();

    expect(key).toBe(
      '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
    );
    expect(getRandomBytesAsyncMock).toHaveBeenCalledWith(32);
    expect(setItemAsyncMock).not.toHaveBeenCalled();
  });

  test('persists a validated database key only when requested', async () => {
    const key = 'ab'.repeat(32);

    await storeDatabaseKey(key);

    expect(setItemAsyncMock).toHaveBeenCalledWith(
      'kerjalog.database-key.v1',
      key,
      expect.objectContaining({
        keychainService: 'kerjalog.database-key',
      }),
    );
  });

  test('rejects an invalid generated key before writing SecureStore', async () => {
    await expect(storeDatabaseKey('invalid')).rejects.toThrow(
      'Generated database encryption key is invalid.',
    );

    expect(setItemAsyncMock).not.toHaveBeenCalled();
  });
});
