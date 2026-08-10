import { Redirect } from 'expo-router';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { useOnboardingCompletion } from '@/features/onboarding/useOnboardingCompletion';
import { useI18n } from '@/i18n/I18nProvider';
import { RouteLoadingScreen } from '@/shared/components/RouteLoadingScreen';

export default function OnboardingRoute() {
  const { t } = useI18n();
  const onboardingStatus = useOnboardingCompletion();

  if (onboardingStatus === 'loading') {
    return <RouteLoadingScreen label={t('common.loading.setup')} />;
  }

  if (onboardingStatus === 'complete') {
    return <Redirect href="/home" />;
  }

  return <OnboardingScreen />;
}
