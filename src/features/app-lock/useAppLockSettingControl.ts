import { useCallback, useState } from 'react';
import { useAppLock } from '@/features/app-lock/AppLockProvider';
import type { AppLockError } from '@/features/app-lock/model';

export type AppLockSettingControl = {
  enabled: boolean;
  error: AppLockError | null;
  isUpdating: boolean;
  updateEnabled: (enabled: boolean) => Promise<boolean>;
};

export function useAppLockSettingControl(): AppLockSettingControl {
  const { enabled, error, isAuthenticating, setEnabled, clearError } =
    useAppLock();
  const [isChanging, setIsChanging] = useState(false);

  const updateEnabled = useCallback(
    async (nextEnabled: boolean): Promise<boolean> => {
      setIsChanging(true);
      clearError();

      try {
        return await setEnabled(nextEnabled);
      } finally {
        setIsChanging(false);
      }
    },
    [clearError, setEnabled],
  );

  return {
    enabled,
    error,
    isUpdating: isChanging || isAuthenticating,
    updateEnabled,
  };
}
