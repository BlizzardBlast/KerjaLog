import type { PropsWithChildren } from 'react';
import Animated, {
  FadeInLeft,
  FadeInRight,
  ReduceMotion,
} from 'react-native-reanimated';
import { motion } from '@/design-system/tokens/motion';
import type { OnboardingStepId } from '@/features/onboarding/model';

export type OnboardingTransitionDirection = 'forward' | 'backward';

export type OnboardingStepTransitionProps = PropsWithChildren<{
  step: OnboardingStepId;
  direction: OnboardingTransitionDirection;
}>;

export function OnboardingStepTransition({
  step,
  direction,
  children,
}: Readonly<OnboardingStepTransitionProps>) {
  const entering = (direction === 'forward' ? FadeInRight : FadeInLeft)
    .duration(motion.duration.screen)
    .reduceMotion(ReduceMotion.System)
    .withInitialValues({
      opacity: 0,
      transform: [{ translateX: direction === 'forward' ? 14 : -14 }],
    });

  return (
    <Animated.View key={step} entering={entering}>
      {children}
    </Animated.View>
  );
}
