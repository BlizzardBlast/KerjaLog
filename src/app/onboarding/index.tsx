import { Redirect } from 'expo-router';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { useOnboardingCompletion } from '@/features/onboarding/useOnboardingCompletion';
import { RouteLoadingScreen } from '@/shared/components/RouteLoadingScreen';

export default function OnboardingRoute() {
  const onboardingStatus = useOnboardingCompletion();

  if (onboardingStatus === 'loading') {
    return <RouteLoadingScreen label="Loading your setup…" />;
  }

  if (onboardingStatus === 'complete') {
    return <Redirect href="/home" />;
  }

  return <OnboardingScreen />;
}
