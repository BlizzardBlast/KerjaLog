import type { ComponentType } from 'react';
import { GoalStep } from '@/features/onboarding/components/GoalStep';
import { ReviewRhythmStep } from '@/features/onboarding/components/ReviewRhythmStep';
import type { OnboardingStepProps } from '@/features/onboarding/components/types';
import { WelcomeStep } from '@/features/onboarding/components/WelcomeStep';
import { WorkContextStep } from '@/features/onboarding/components/WorkContextStep';
import {
  hasRequiredOnboardingAnswers,
  type OnboardingState,
  type OnboardingStepId,
} from '@/features/onboarding/model';
import type { TranslationKey } from '@/i18n/translations';

type OnboardingStepConfig = {
  Component: ComponentType<OnboardingStepProps>;
  canContinue: (state: OnboardingState) => boolean;
  primaryActionKey: TranslationKey;
  isFinal: boolean;
};

export const ONBOARDING_STEP_CONFIG: Record<
  OnboardingStepId,
  OnboardingStepConfig
> = {
  welcome: {
    Component: WelcomeStep,
    canContinue: () => true,
    primaryActionKey: 'common.action.startSetup',
    isFinal: false,
  },
  'work-context': {
    Component: WorkContextStep,
    canContinue: (state) =>
      state.workArea !== undefined && state.careerLevel !== undefined,
    primaryActionKey: 'common.action.continue',
    isFinal: false,
  },
  goal: {
    Component: GoalStep,
    canContinue: (state) => state.mainGoal !== undefined,
    primaryActionKey: 'common.action.continue',
    isFinal: false,
  },
  'review-rhythm': {
    Component: ReviewRhythmStep,
    canContinue: hasRequiredOnboardingAnswers,
    primaryActionKey: 'common.action.finishSetup',
    isFinal: true,
  },
};
