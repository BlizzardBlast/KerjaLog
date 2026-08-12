import * as ScreenCapture from 'expo-screen-capture';
import { Platform } from 'react-native';

const APP_LOCK_SCREEN_CAPTURE_KEY = 'kerjalog-app-lock';

export async function setAppLockScreenPrivacyEnabled(
  enabled: boolean,
): Promise<void> {
  if (Platform.OS === 'ios') {
    if (enabled) {
      await ScreenCapture.enableAppSwitcherProtectionAsync(1);
    } else {
      await ScreenCapture.disableAppSwitcherProtectionAsync();
    }
    return;
  }

  if (Platform.OS === 'android') {
    if (enabled) {
      await ScreenCapture.preventScreenCaptureAsync(
        APP_LOCK_SCREEN_CAPTURE_KEY,
      );
    } else {
      await ScreenCapture.allowScreenCaptureAsync(APP_LOCK_SCREEN_CAPTURE_KEY);
    }
  }
}
