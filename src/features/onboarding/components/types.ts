import type {
  OnboardingPatch,
  OnboardingState,
} from '@/features/onboarding/model';

export type OnboardingStepProps = {
  state: OnboardingState;
  update: (patch: OnboardingPatch) => void;
  hasFinishError: boolean;
};
