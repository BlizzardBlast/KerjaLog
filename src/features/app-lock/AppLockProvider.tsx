import { createContext, type PropsWithChildren, use } from 'react';
import type { AppLockContextValue } from '@/features/app-lock/model';
import { useAppLockController } from '@/features/app-lock/useAppLockController';

export type {
  AppLockContextValue,
  AppLockError,
} from '@/features/app-lock/model';

const AppLockContext = createContext<AppLockContextValue | null>(null);

export function AppLockProvider({ children }: PropsWithChildren) {
  const value = useAppLockController();

  return <AppLockContext value={value}>{children}</AppLockContext>;
}

export function useAppLock(): AppLockContextValue {
  const context = use(AppLockContext);

  if (!context) {
    throw new Error('useAppLock must be used inside AppLockProvider.');
  }

  return context;
}
