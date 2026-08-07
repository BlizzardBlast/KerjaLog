import { Redirect } from 'expo-router';
import { useOnboardingCompletion } from '@/features/onboarding/useOnboardingCompletion';
import { useI18n } from '@/i18n/I18nProvider';
import { RouteLoadingScreen } from '@/shared/components/RouteLoadingScreen';

export default function AppEntryRoute() {
  const { t } = useI18n();
  const onboardingStatus = useOnboardingCompletion();

  if (onboardingStatus === 'loading') {
    return <RouteLoadingScreen label={t('common.loading.opening')} />;
  }

  return (
    <Redirect href={onboardingStatus === 'complete' ? '/home' : '/onboarding'} />
  );
}
