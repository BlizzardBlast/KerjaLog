import { isRunningInExpoGo } from 'expo';

export function assertEncryptedStorageRuntimeSupported(): void {
  if (isRunningInExpoGo()) {
    throw new Error(
      'KerjaLog encrypted storage requires a development or production build; SQLCipher is not available in Expo Go.',
    );
  }
}
