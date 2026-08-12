import { isRunningInExpoGo } from 'expo';
import { assertEncryptedStorageRuntimeSupported } from '@/platform/runtime/encryptedStorageRuntime';

jest.mock('expo', () => ({
  isRunningInExpoGo: jest.fn(),
}));

const isRunningInExpoGoMock = jest.mocked(isRunningInExpoGo);

describe('encrypted storage runtime', () => {
  test('allows development and production builds', () => {
    isRunningInExpoGoMock.mockReturnValue(false);

    expect(() => assertEncryptedStorageRuntimeSupported()).not.toThrow();
  });

  test('explains that SQLCipher is unavailable in Expo Go', () => {
    isRunningInExpoGoMock.mockReturnValue(true);

    expect(() => assertEncryptedStorageRuntimeSupported()).toThrow(
      'KerjaLog encrypted storage requires a development or production build; SQLCipher is not available in Expo Go.',
    );
  });
});
