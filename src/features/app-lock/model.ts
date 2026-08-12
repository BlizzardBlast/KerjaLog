export type AppLockError =
  | 'unavailable'
  | 'cancelled'
  | 'authentication-failed'
  | 'storage-failed'
  | 'privacy-failed';

export type AppLockContextValue = {
  enabled: boolean;
  locked: boolean;
  isHydrated: boolean;
  isAuthenticating: boolean;
  error: AppLockError | null;
  setEnabled: (enabled: boolean) => Promise<boolean>;
  unlock: () => Promise<boolean>;
  clearError: () => void;
};
