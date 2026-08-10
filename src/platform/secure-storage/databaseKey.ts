import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const DATABASE_KEY_NAME = 'kerjalog.database-key.v1';
const DATABASE_KEY_PATTERN = /^[0-9a-f]{64}$/u;

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainService: 'kerjalog.database-key',
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function getOrCreateDatabaseKey(): Promise<string> {
  const storedKey = await SecureStore.getItemAsync(
    DATABASE_KEY_NAME,
    secureStoreOptions,
  );

  if (storedKey) {
    if (!DATABASE_KEY_PATTERN.test(storedKey)) {
      throw new Error('Stored database encryption key is invalid.');
    }

    return storedKey;
  }

  const bytes = await Crypto.getRandomBytesAsync(32);
  const key = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');

  await SecureStore.setItemAsync(DATABASE_KEY_NAME, key, secureStoreOptions);

  return key;
}
