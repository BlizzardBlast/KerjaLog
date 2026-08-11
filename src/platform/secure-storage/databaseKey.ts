import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const DATABASE_KEY_NAME = 'kerjalog.database-key.v1';
const DATABASE_KEY_PATTERN = /^[0-9a-f]{64}$/u;

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainService: 'kerjalog.database-key',
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function getStoredDatabaseKey(): Promise<string | null> {
  const storedKey = await SecureStore.getItemAsync(
    DATABASE_KEY_NAME,
    secureStoreOptions,
  );

  if (storedKey === null) {
    return null;
  }

  assertValidDatabaseKey(storedKey, 'Stored');
  return storedKey;
}

export async function generateDatabaseKey(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

export async function storeDatabaseKey(key: string): Promise<void> {
  assertValidDatabaseKey(key, 'Generated');
  await SecureStore.setItemAsync(DATABASE_KEY_NAME, key, secureStoreOptions);
}

function assertValidDatabaseKey(key: string, source: string): void {
  if (!DATABASE_KEY_PATTERN.test(key)) {
    throw new Error(`${source} database encryption key is invalid.`);
  }
}
