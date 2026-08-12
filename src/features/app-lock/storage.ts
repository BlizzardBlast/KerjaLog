import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_LOCK_ENABLED_STORAGE_KEY = '@kerjalog/app-lock-enabled/v1';

export async function readAppLockEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(APP_LOCK_ENABLED_STORAGE_KEY);

  if (value === null || value === 'false') {
    return false;
  }

  if (value === 'true') {
    return true;
  }

  throw new Error('Stored app lock preference is invalid.');
}

export async function writeAppLockEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(APP_LOCK_ENABLED_STORAGE_KEY, String(enabled));
}
