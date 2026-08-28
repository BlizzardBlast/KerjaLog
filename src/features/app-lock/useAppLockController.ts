import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type {
  AppLockContextValue,
  AppLockError,
} from '@/features/app-lock/model';
import {
  readAppLockEnabled,
  writeAppLockEnabled,
} from '@/features/app-lock/storage';
import { useI18n } from '@/i18n/I18nProvider';
import {
  authenticateDevice,
  getDeviceAuthenticationAvailability,
} from '@/platform/authentication/deviceAuthentication';
import { setAppLockScreenPrivacyEnabled } from '@/platform/privacy/screenPrivacy';
import { ignoreError } from '@/shared/utils/function';

function mapAuthenticationError(error: string | undefined): AppLockError {
  if (
    error === 'user_cancel' ||
    error === 'app_cancel' ||
    error === 'system_cancel' ||
    error === 'user_fallback'
  ) {
    return 'cancelled';
  }

  if (
    error === 'not_available' ||
    error === 'not_enrolled' ||
    error === 'passcode_not_set'
  ) {
    return 'unavailable';
  }

  return 'authentication-failed';
}

async function persistEnabledAppLock(): Promise<AppLockError | null> {
  try {
    await setAppLockScreenPrivacyEnabled(true);
  } catch {
    return 'privacy-failed';
  }

  try {
    await writeAppLockEnabled(true);
    return null;
  } catch {
    try {
      await setAppLockScreenPrivacyEnabled(false);
    } catch {
      return 'privacy-failed';
    }

    return 'storage-failed';
  }
}

async function persistDisabledAppLock(): Promise<AppLockError | null> {
  // Remove native privacy first while the durable preference is still enabled.
  // If persistence fails, restore privacy so the next launch remains fail-closed.
  try {
    await setAppLockScreenPrivacyEnabled(false);
  } catch {
    return 'privacy-failed';
  }

  try {
    await writeAppLockEnabled(false);
    return null;
  } catch {
    try {
      await setAppLockScreenPrivacyEnabled(true);
    } catch {
      return 'privacy-failed';
    }

    return 'storage-failed';
  }
}

function persistAppLockSetting(enabled: boolean): Promise<AppLockError | null> {
  return enabled ? persistEnabledAppLock() : persistDisabledAppLock();
}

export function useAppLockController(): AppLockContextValue {
  const { t } = useI18n();
  const [enabledState, setEnabledState] = useState(false);
  const [locked, setLocked] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<AppLockError | null>(null);
  const authenticationInProgress = useRef(false);

  useEffect(() => {
    let ignore = false;

    const hydrate = async () => {
      try {
        const storedEnabled = await readAppLockEnabled();

        if (storedEnabled) {
          try {
            await setAppLockScreenPrivacyEnabled(true);
          } catch {
            if (!ignore) {
              setEnabledState(true);
              setLocked(true);
              setError('privacy-failed');
            }
            return;
          }
        }

        if (!ignore) {
          setEnabledState(storedEnabled);
          setLocked(storedEnabled);
        }
      } catch {
        // The preference is privacy-sensitive: if it cannot be read, require
        // device authentication and best-effort native screen protection rather
        // than assuming App Lock was disabled.
        await setAppLockScreenPrivacyEnabled(true).catch(ignoreError);

        if (!ignore) {
          setEnabledState(true);
          setLocked(true);
          setError('storage-failed');
        }
      } finally {
        if (!ignore) {
          setIsHydrated(true);
        }
      }
    };

    hydrate().catch(ignoreError);

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        enabledState &&
        nextState !== 'active' &&
        !authenticationInProgress.current
      ) {
        setLocked(true);
        setError(null);
      }
    });

    return () => subscription.remove();
  }, [enabledState]);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (authenticationInProgress.current) {
      return false;
    }

    authenticationInProgress.current = true;
    setIsAuthenticating(true);
    setError(null);

    try {
      const availability = await getDeviceAuthenticationAvailability();

      if (!availability.canAuthenticate) {
        setError('unavailable');
        return false;
      }

      const result = await authenticateDevice({
        promptMessage: t('appLock.auth.prompt'),
        promptDescription: t('appLock.auth.description'),
        cancelLabel: t('appLock.auth.cancel'),
        fallbackLabel: t('appLock.auth.fallback'),
      });

      if (result.success) {
        return true;
      }

      setError(mapAuthenticationError(result.error));
      return false;
    } catch {
      setError('authentication-failed');
      return false;
    } finally {
      authenticationInProgress.current = false;
      setIsAuthenticating(false);
    }
  }, [t]);

  const setEnabled = useCallback(
    async (nextEnabled: boolean): Promise<boolean> => {
      if (nextEnabled === enabledState) {
        return true;
      }

      const authenticated = await authenticate();
      if (!authenticated) {
        return false;
      }

      const persistenceError = await persistAppLockSetting(nextEnabled);
      if (persistenceError) {
        setError(persistenceError);
        return false;
      }

      setEnabledState(nextEnabled);
      setLocked(false);
      setError(null);
      return true;
    },
    [authenticate, enabledState],
  );

  const unlock = useCallback(async (): Promise<boolean> => {
    if (!enabledState) {
      setLocked(false);
      return true;
    }

    try {
      await setAppLockScreenPrivacyEnabled(true);
    } catch {
      setError('privacy-failed');
      return false;
    }

    const authenticated = await authenticate();
    if (authenticated) {
      setLocked(false);
      setError(null);
    }

    return authenticated;
  }, [authenticate, enabledState]);

  const clearError = useCallback(() => setError(null), []);

  return {
    enabled: enabledState,
    locked,
    isHydrated,
    isAuthenticating,
    error,
    setEnabled,
    unlock,
    clearError,
  };
}
