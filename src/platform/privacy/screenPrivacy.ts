import * as ScreenCapture from 'expo-screen-capture';
import { Platform } from 'react-native';

const APP_LOCK_SCREEN_CAPTURE_KEY = 'kerjalog-app-lock';

type ScreenPrivacyRuntime = {
  readonly isDevelopment: boolean;
  readonly platform: typeof Platform.OS;
};

function getScreenPrivacyRuntime(): ScreenPrivacyRuntime {
  return { isDevelopment: __DEV__, platform: Platform.OS };
}

export async function setAppLockScreenPrivacyEnabled(
  enabled: boolean,
): Promise<void> {
  const runtime = getScreenPrivacyRuntime();

  if (runtime.platform === 'ios') {
    if (enabled) {
      await ScreenCapture.enableAppSwitcherProtectionAsync(1);
    } else {
      await ScreenCapture.disableAppSwitcherProtectionAsync();
    }
    return;
  }

  if (runtime.platform === 'android') {
    if (enabled && !runtime.isDevelopment) {
      await ScreenCapture.preventScreenCaptureAsync(
        APP_LOCK_SCREEN_CAPTURE_KEY,
      );
    } else {
      await ScreenCapture.allowScreenCaptureAsync(APP_LOCK_SCREEN_CAPTURE_KEY);
    }
  }
}
