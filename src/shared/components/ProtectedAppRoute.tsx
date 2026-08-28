import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { useOnboardingCompletion } from '@/features/onboarding/useOnboardingCompletion';
import { useI18n } from '@/i18n/I18nProvider';
import { RouteLoadingScreen } from '@/shared/components/RouteLoadingScreen';

type ProtectedAppRouteProps = {
  children: ReactNode;
};

export function ProtectedAppRoute({ children }: Readonly<ProtectedAppRouteProps>) {
  const { t } = useI18n();
  const onboardingStatus = useOnboardingCompletion();

  if (onboardingStatus === 'loading') {
    return <RouteLoadingScreen label={t('common.loading.opening')} />;
  }

  if (onboardingStatus === 'incomplete') {
    return <Redirect href="/onboarding" />;
  }

  return children;
}
