import { useOnboarding } from '@/features/onboarding/useOnboarding';

export type OnboardingCompletionStatus = 'loading' | 'incomplete' | 'complete';

export function useOnboardingCompletion(): OnboardingCompletionStatus {
  const { state, isHydrated } = useOnboarding();

  if (!isHydrated) {
    return 'loading';
  }

  return state.completed ? 'complete' : 'incomplete';
}
