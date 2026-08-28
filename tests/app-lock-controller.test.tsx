import * as LocalAuthentication from 'expo-local-authentication';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import {
  readAppLockEnabled,
  writeAppLockEnabled,
} from '@/features/app-lock/storage';
import { useAppLockController } from '@/features/app-lock/useAppLockController';
import {
  authenticateDevice,
  getDeviceAuthenticationAvailability,
} from '@/platform/authentication/deviceAuthentication';
import { setAppLockScreenPrivacyEnabled } from '@/platform/privacy/screenPrivacy';

jest.mock('@/features/app-lock/storage', () => ({
  readAppLockEnabled: jest.fn(),
  writeAppLockEnabled: jest.fn(),
}));

jest.mock('@/platform/authentication/deviceAuthentication', () => ({
  authenticateDevice: jest.fn(),
  getDeviceAuthenticationAvailability: jest.fn(),
}));

jest.mock('@/platform/privacy/screenPrivacy', () => ({
  setAppLockScreenPrivacyEnabled: jest.fn(),
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
const setScreenPrivacyMock = jest.mocked(setAppLockScreenPrivacyEnabled);

describe('useAppLockController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    writeAppLockEnabledMock.mockResolvedValue(undefined);
    setScreenPrivacyMock.mockResolvedValue(undefined);
    getDeviceAuthenticationAvailabilityMock.mockResolvedValue({
      level: LocalAuthentication.SecurityLevel.SECRET,
      hasBiometricHardware: false,
      hasEnrolledBiometrics: false,
      canAuthenticate: true,
    });
    authenticateDeviceMock.mockResolvedValue({ success: true });
  });

  test('hydrates an enabled preference into a locked and natively protected session', async () => {
    readAppLockEnabledMock.mockResolvedValue(true);
    const { result } = await renderHook(() => useAppLockController());

    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    expect(setScreenPrivacyMock).toHaveBeenCalledWith(true);
    expect(result.current.enabled).toBe(true);
    expect(result.current.locked).toBe(true);
    expect(result.current.error).toBeNull();
  });

  test('fails closed when the app lock preference cannot be read', async () => {
    readAppLockEnabledMock.mockRejectedValue(new Error('storage unavailable'));
    const { result } = await renderHook(() => useAppLockController());

    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    expect(setScreenPrivacyMock).toHaveBeenCalledWith(true);
    expect(result.current.enabled).toBe(true);
    expect(result.current.locked).toBe(true);
    expect(result.current.error).toBe('storage-failed');
  });

  test('stays locked when native screen privacy cannot be established', async () => {
    readAppLockEnabledMock.mockResolvedValue(true);
    setScreenPrivacyMock.mockRejectedValueOnce(
      new Error('privacy unavailable'),
    );
    const { result } = await renderHook(() => useAppLockController());

    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    expect(result.current.enabled).toBe(true);
    expect(result.current.locked).toBe(true);
    expect(result.current.error).toBe('privacy-failed');
  });

  test('enables native privacy before persisting an enabled App Lock setting', async () => {
    readAppLockEnabledMock.mockResolvedValue(false);
    const { result } = await renderHook(() => useAppLockController());

    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    await act(async () => {
      await expect(result.current.setEnabled(true)).resolves.toBe(true);
    });

    expect(setScreenPrivacyMock).toHaveBeenCalledWith(true);
    expect(writeAppLockEnabledMock).toHaveBeenCalledWith(true);
    expect(setScreenPrivacyMock.mock.invocationCallOrder[0]).toBeLessThan(
      writeAppLockEnabledMock.mock.invocationCallOrder[0] ?? 0,
    );
    expect(result.current.enabled).toBe(true);
  });

  test('rolls back native privacy if persisting an enabled setting fails', async () => {
    readAppLockEnabledMock.mockResolvedValue(false);
    const { result } = await renderHook(() => useAppLockController());

    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    jest.clearAllMocks();
    writeAppLockEnabledMock.mockRejectedValueOnce(
      new Error('storage unavailable'),
    );

    await act(async () => {
      await expect(result.current.setEnabled(true)).resolves.toBe(false);
    });

    expect(setScreenPrivacyMock.mock.calls).toEqual([[true], [false]]);
    expect(writeAppLockEnabledMock).toHaveBeenCalledWith(true);
    expect(result.current.enabled).toBe(false);
    expect(result.current.error).toBe('storage-failed');
  });

  test('removes native privacy before persisting a disabled App Lock setting', async () => {
    readAppLockEnabledMock.mockResolvedValue(true);
    const { result } = await renderHook(() => useAppLockController());

    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    jest.clearAllMocks();

    await act(async () => {
      await expect(result.current.setEnabled(false)).resolves.toBe(true);
    });

    expect(setScreenPrivacyMock).toHaveBeenCalledWith(false);
    expect(writeAppLockEnabledMock).toHaveBeenCalledWith(false);
    expect(setScreenPrivacyMock.mock.invocationCallOrder[0]).toBeLessThan(
      writeAppLockEnabledMock.mock.invocationCallOrder[0] ?? 0,
    );
    expect(result.current.enabled).toBe(false);
  });

  test('restores native privacy if persisting a disabled setting fails', async () => {
    readAppLockEnabledMock.mockResolvedValue(true);
    const { result } = await renderHook(() => useAppLockController());

    await waitFor(() => expect(result.current.isHydrated).toBe(true));
    jest.clearAllMocks();
    writeAppLockEnabledMock.mockRejectedValueOnce(
      new Error('storage unavailable'),
    );

    await act(async () => {
      await expect(result.current.setEnabled(false)).resolves.toBe(false);
    });

    expect(setScreenPrivacyMock.mock.calls).toEqual([[false], [true]]);
    expect(writeAppLockEnabledMock).toHaveBeenCalledWith(false);
    expect(result.current.enabled).toBe(true);
    expect(result.current.error).toBe('storage-failed');
  });
});
