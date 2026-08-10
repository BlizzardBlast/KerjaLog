import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { useI18n } from '@/i18n/I18nProvider';
import {
  authenticateDevice,
  getDeviceAuthenticationAvailability,
} from '@/platform/authentication/deviceAuthentication';
import {
  readAppLockEnabled,
  writeAppLockEnabled,
} from '@/features/app-lock/storage';

export type AppLockError =
  | 'unavailable'
  | 'cancelled'
  | 'authentication-failed'
  | 'storage-failed';

type AppLockContextValue = {
  enabled: boolean;
  locked: boolean;
  isHydrated: boolean;
  isAuthenticating: boolean;
  error: AppLockError | null;
  setEnabled: (enabled: boolean) => Promise<boolean>;
  unlock: () => Promise<boolean>;
  clearError: () => void;
};

const AppLockContext = createContext<AppLockContextValue | null>(null);

export function AppLockProvider({ children }: PropsWithChildren) {
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

      if (
        result.error === 'user_cancel' ||
        result.error === 'app_cancel' ||
        result.error === 'system_cancel' ||
        result.error === 'user_fallback'
      ) {
        setError('cancelled');
      } else if (
        result.error === 'not_available' ||
        result.error === 'not_enrolled' ||
        result.error === 'passcode_not_set'
      ) {
        setError('unavailable');
      } else {
        setError('authentication-failed');
      }

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

  const value: AppLockContextValue = {
    enabled,
    locked,
    isHydrated,
    isAuthenticating,
    error,
    setEnabled,
    unlock,
    clearError,
  };

  return <AppLockContext value={value}>{children}</AppLockContext>;
}

export function useAppLock(): AppLockContextValue {
  const context = use(AppLockContext);

  if (!context) {
    throw new Error('useAppLock must be used inside AppLockProvider.');
  }

  return context;
}
