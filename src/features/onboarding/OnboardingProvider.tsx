import { createContext, type PropsWithChildren } from 'react';
import {
  type OnboardingContextValue,
  useOnboardingController,
} from '@/features/onboarding/useOnboardingController';

export const OnboardingContext = createContext<OnboardingContextValue | null>(
  null,
);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const value = useOnboardingController();

  return <OnboardingContext value={value}>{children}</OnboardingContext>;
}
