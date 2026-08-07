import { Redirect } from 'expo-router';
import { useOnboardingCompletion } from '@/features/onboarding/useOnboardingCompletion';
import { useI18n } from '@/i18n/I18nProvider';
import { AppTabs } from '@/navigation/AppTabs';
import { RouteLoadingScreen } from '@/shared/components/RouteLoadingScreen';

export default function TabsLayout() {
  const { t } = useI18n();
  const onboardingStatus = useOnboardingCompletion();

  if (onboardingStatus === 'loading') {
    return <RouteLoadingScreen label={t('common.loading.opening')} />;
  }

  if (onboardingStatus === 'incomplete') {
    return <Redirect href="/onboarding" />;
  }

  return <AppTabs />;
}
