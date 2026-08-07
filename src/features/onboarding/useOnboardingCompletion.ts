import { useEffect, useState } from 'react';
import { loadOnboardingState } from '@/features/onboarding/storage';

export type OnboardingCompletionStatus =
  | 'loading'
  | 'incomplete'
  | 'complete';

export function useOnboardingCompletion(): OnboardingCompletionStatus {
  const [status, setStatus] = useState<OnboardingCompletionStatus>('loading');

  useEffect(() => {
    let isActive = true;

    loadOnboardingState()
      .then((state) => {
        if (isActive) {
          setStatus(state.completed ? 'complete' : 'incomplete');
        }
      })
      .catch(() => {
        if (isActive) {
          setStatus('incomplete');
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  return status;
}
