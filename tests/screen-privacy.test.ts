import * as ScreenCapture from 'expo-screen-capture';
import { Platform } from 'react-native';
import { setAppLockScreenPrivacyEnabled } from '@/platform/privacy/screenPrivacy';

jest.mock('expo-screen-capture', () => ({
  enableAppSwitcherProtectionAsync: jest.fn(),
  disableAppSwitcherProtectionAsync: jest.fn(),
  preventScreenCaptureAsync: jest.fn(),
  allowScreenCaptureAsync: jest.fn(),
}));

const enableIosPrivacyMock = jest.mocked(
  ScreenCapture.enableAppSwitcherProtectionAsync,
);
const disableIosPrivacyMock = jest.mocked(
  ScreenCapture.disableAppSwitcherProtectionAsync,
);
const preventScreenCaptureMock = jest.mocked(
  ScreenCapture.preventScreenCaptureAsync,
);
const allowScreenCaptureMock = jest.mocked(
  ScreenCapture.allowScreenCaptureAsync,
);

const originalPlatform = Platform.OS;
const originalDevelopment = __DEV__;

function setPlatform(os: typeof Platform.OS) {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: os,
  });
}

function setDevelopment(isDevelopment: boolean) {
  Object.defineProperty(globalThis, '__DEV__', {
    configurable: true,
    value: isDevelopment,
  });
}

afterEach(() => {
  jest.clearAllMocks();
  setPlatform(originalPlatform);
  setDevelopment(originalDevelopment);
});

describe('App Lock screen privacy', () => {
  test('uses app-switcher blur protection on iOS', async () => {
    setPlatform('ios');

    await setAppLockScreenPrivacyEnabled(true);
    await setAppLockScreenPrivacyEnabled(false);

    expect(enableIosPrivacyMock).toHaveBeenCalledWith(1);
    expect(disableIosPrivacyMock).toHaveBeenCalledTimes(1);
    expect(preventScreenCaptureMock).not.toHaveBeenCalled();
  });

  test('uses FLAG_SECURE-backed screen capture protection on Android', async () => {
    setPlatform('android');
    setDevelopment(false);
    await setAppLockScreenPrivacyEnabled(true);
    await setAppLockScreenPrivacyEnabled(false);

    expect(preventScreenCaptureMock).toHaveBeenCalledWith('kerjalog-app-lock');
    expect(allowScreenCaptureMock).toHaveBeenCalledWith('kerjalog-app-lock');
    expect(enableIosPrivacyMock).not.toHaveBeenCalled();
  });

  test('does not set a secure screenshot flag in Android development runtimes', async () => {
    setPlatform('android');
    setDevelopment(true);
    await setAppLockScreenPrivacyEnabled(true);

    expect(preventScreenCaptureMock).not.toHaveBeenCalled();
    expect(allowScreenCaptureMock).toHaveBeenCalledWith('kerjalog-app-lock');
  });
});
