import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { loadOnboardingState } from '@/features/onboarding/storage';
import { useI18n } from '@/i18n/I18nProvider';
import { RouteLoadingScreen } from '@/shared/components/RouteLoadingScreen';

export default function AppEntryRoute() {
  const { t } = useI18n();
  const [isReady, setIsReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    let isActive = true;

    loadOnboardingState().then((state) => {
      if (!isActive) {
        return;
      }

      setHasCompletedOnboarding(state.completed);
      setIsReady(true);
    });

    return () => {
      isActive = false;
    };
  }, []);

  if (!isReady) {
    return <RouteLoadingScreen label={t('common.loading.opening')} />;
  }

  return <Redirect href={hasCompletedOnboarding ? '/home' : '/onboarding'} />;
}
