import { Redirect } from 'expo-router';
import { useOnboardingCompletion } from '@/features/onboarding/useOnboardingCompletion';
import { AppTabs } from '@/navigation/AppTabs';
import { RouteLoadingScreen } from '@/shared/components/RouteLoadingScreen';

export default function TabsLayout() {
  const onboardingStatus = useOnboardingCompletion();

  if (onboardingStatus === 'loading') {
    return <RouteLoadingScreen label="Opening KerjaLog…" />;
  }

  if (onboardingStatus === 'incomplete') {
    return <Redirect href="/onboarding" />;
  }

  return <AppTabs />;
}
