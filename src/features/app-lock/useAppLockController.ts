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

export function useAppLockController(): AppLockContextValue {
  const { t } = useI18n();
  const [enabled, setEnabledState] = useState(false);
  const [locked, setLocked] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<AppLockError | null>(null);
  const authenticationInProgress = useRef(false);

  useEffect(() => {
    let ignore = false;

    readAppLockEnabled()
      .then((storedEnabled) => {
        if (ignore) {
          return;
        }

        setEnabledState(storedEnabled);
        setLocked(storedEnabled);
      })
      .catch(() => {
        if (!ignore) {
          // The preference is privacy-sensitive: if it cannot be read, require
          // device authentication rather than assuming App Lock was disabled.
          setEnabledState(true);
          setLocked(true);
          setError('storage-failed');
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsHydrated(true);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        enabled &&
        nextState !== 'active' &&
        !authenticationInProgress.current
      ) {
        setLocked(true);
        setError(null);
      }
    });

    return () => subscription.remove();
  }, [enabled]);

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
      if (nextEnabled === enabled) {
        return true;
      }

      const authenticated = await authenticate();
      if (!authenticated) {
        return false;
      }

      try {
        await writeAppLockEnabled(nextEnabled);
        setEnabledState(nextEnabled);
        setLocked(false);
        setError(null);
        return true;
      } catch {
        setError('storage-failed');
        return false;
      }
    },
    [authenticate, enabled],
  );

  const unlock = useCallback(async (): Promise<boolean> => {
    if (!enabled) {
      setLocked(false);
      return true;
    }

    const authenticated = await authenticate();
    if (authenticated) {
      setLocked(false);
      setError(null);
    }

    return authenticated;
  }, [authenticate, enabled]);

  const clearError = useCallback(() => setError(null), []);

  return {
    enabled,
    locked,
    isHydrated,
    isAuthenticating,
    error,
    setEnabled,
    unlock,
    clearError,
  };
}

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
