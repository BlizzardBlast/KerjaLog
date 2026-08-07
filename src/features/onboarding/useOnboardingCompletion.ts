import { useEffect, useState } from 'react';
import { loadOnboardingState } from '@/features/onboarding/storage';
import { EMPTY_FUNCTION } from '@/shared/utils/function';

export type OnboardingCompletionStatus = 'loading' | 'incomplete' | 'complete';

export function useOnboardingCompletion(): OnboardingCompletionStatus {
  const [status, setStatus] = useState<OnboardingCompletionStatus>('loading');

  useEffect(() => {
    let ignore = false;

    const hydrateCompletionStatus = async () => {
      const state = await loadOnboardingState();

      if (!ignore) {
        setStatus(state.completed ? 'complete' : 'incomplete');
      }
    };

    hydrateCompletionStatus().catch(EMPTY_FUNCTION);

    return () => {
      ignore = true;
    };
  }, []);

  return status;
}
