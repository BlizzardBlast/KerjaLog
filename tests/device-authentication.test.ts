import * as LocalAuthentication from 'expo-local-authentication';
import {
  authenticateDevice,
  getDeviceAuthenticationAvailability,
} from '@/platform/authentication/deviceAuthentication';

jest.mock('expo-local-authentication', () => ({
  SecurityLevel: {
    NONE: 0,
    SECRET: 1,
    BIOMETRIC_WEAK: 2,
    BIOMETRIC_STRONG: 3,
  },
  authenticateAsync: jest.fn(),
  getEnrolledLevelAsync: jest.fn(),
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
}));

const authenticateAsyncMock = jest.mocked(
  LocalAuthentication.authenticateAsync,
);
const getEnrolledLevelAsyncMock = jest.mocked(
  LocalAuthentication.getEnrolledLevelAsync,
);
const hasHardwareAsyncMock = jest.mocked(LocalAuthentication.hasHardwareAsync);
const isEnrolledAsyncMock = jest.mocked(LocalAuthentication.isEnrolledAsync);

describe('device authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('treats a device PIN/passcode enrollment as authentication-capable', async () => {
    getEnrolledLevelAsyncMock.mockResolvedValue(
      LocalAuthentication.SecurityLevel.SECRET,
    );
    hasHardwareAsyncMock.mockResolvedValue(false);
    isEnrolledAsyncMock.mockResolvedValue(false);

    await expect(getDeviceAuthenticationAvailability()).resolves.toEqual({
      level: LocalAuthentication.SecurityLevel.SECRET,
      hasBiometricHardware: false,
      hasEnrolledBiometrics: false,
      canAuthenticate: true,
    });
  });

  test('keeps system device-credential fallback enabled', async () => {
    authenticateAsyncMock.mockResolvedValue({ success: true });

    await expect(
      authenticateDevice({
        promptMessage: 'Unlock KerjaLog',
        promptDescription: 'Confirm your identity.',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use device passcode',
      }),
    ).resolves.toEqual({ success: true });

    expect(authenticateAsyncMock).toHaveBeenCalledWith({
      promptMessage: 'Unlock KerjaLog',
      promptDescription: 'Confirm your identity.',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use device passcode',
      disableDeviceFallback: false,
      biometricsSecurityLevel: 'strong',
    });
  });
});
