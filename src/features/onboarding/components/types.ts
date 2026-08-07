import type { OnboardingState } from '@/features/onboarding/model';

export type OnboardingStepProps = {
  state: OnboardingState;
  update: (patch: Partial<OnboardingState>) => void;
  hasFinishError: boolean;
};
