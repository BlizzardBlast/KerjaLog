import { renderHook, waitFor } from '@testing-library/react-native';
import {
  readAppLockEnabled,
  writeAppLockEnabled,
} from '@/features/app-lock/storage';
import { useAppLockController } from '@/features/app-lock/useAppLockController';
import {
  authenticateDevice,
  getDeviceAuthenticationAvailability,
} from '@/platform/authentication/deviceAuthentication';

jest.mock('@/features/app-lock/storage', () => ({
  readAppLockEnabled: jest.fn(),
  writeAppLockEnabled: jest.fn(),
}));

jest.mock('@/platform/authentication/deviceAuthentication', () => ({
  authenticateDevice: jest.fn(),
  getDeviceAuthenticationAvailability: jest.fn(),
}));

jest.mock('@/i18n/I18nProvider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

const readAppLockEnabledMock = jest.mocked(readAppLockEnabled);
const writeAppLockEnabledMock = jest.mocked(writeAppLockEnabled);
const authenticateDeviceMock = jest.mocked(authenticateDevice);
const getDeviceAuthenticationAvailabilityMock = jest.mocked(
  getDeviceAuthenticationAvailability,
);

describe('useAppLockController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    writeAppLockEnabledMock.mockResolvedValue(undefined);
    getDeviceAuthenticationAvailabilityMock.mockResolvedValue({
      canAuthenticate: true,
      hasHardware: true,
      isEnrolled: true,
    });
    authenticateDeviceMock.mockResolvedValue({ success: true });
  });

  test('hydrates an enabled preference into a locked session', async () => {
    readAppLockEnabledMock.mockResolvedValue(true);
    const { result } = await renderHook(() => useAppLockController());

    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    expect(result.current.enabled).toBe(true);
    expect(result.current.locked).toBe(true);
    expect(result.current.error).toBeNull();
  });

  test('fails closed when the app lock preference cannot be read', async () => {
    readAppLockEnabledMock.mockRejectedValue(new Error('storage unavailable'));
    const { result } = await renderHook(() => useAppLockController());

    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    expect(result.current.enabled).toBe(true);
    expect(result.current.locked).toBe(true);
    expect(result.current.error).toBe('storage-failed');
  });
});
