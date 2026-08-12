# KerjaLog native journey checks

Run these against a clean Android/iOS development build. The automated core flow assumes the device language is English.

## Automated core flow

```bash
maestro test .maestro/log-entry.yaml
```

The core flow covers onboarding, Log capture, native Back protection inside the wizard, save, Home refresh, and saved-entry rendering.

## Native security scenario

Biometric/device-credential prompts and OS app-switcher snapshots vary by simulator/device and are intentionally validated as a manual-assisted native scenario:

1. Complete onboarding with App Lock off and create a partial Log draft.
2. Configure a device PIN/passcode and enrolled biometrics.
3. Enable App Lock from KerjaLog and complete the native authentication prompt.
4. Background the app while the partial draft is visible.
5. Verify the iOS app-switcher preview is protected, or the Android recent-app preview is blank.
6. On Android, verify screenshots are blocked while App Lock is enabled.
7. Reopen KerjaLog, authenticate, and verify the partial draft is preserved.
8. Fully stop and relaunch KerjaLog; verify the encrypted draft is restored from SQLCipher.
9. Disable App Lock only after successful device authentication and verify normal screenshots/app-switcher behavior returns.
10. Remove exact-alarm special access on Android 12+ while the weekly reminder is enabled, reopen KerjaLog, and verify the reminder remains ON with the approximate-time notice.
11. Grant exact-alarm special access, return to KerjaLog, and verify the approximate-time notice disappears after reconciliation.

Never capture or commit screenshots containing real workplace information when running these checks.
