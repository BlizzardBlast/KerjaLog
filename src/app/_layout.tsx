import type { ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StrictMode } from 'react';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import { AppLockProvider } from '@/features/app-lock/AppLockProvider';
import { OnboardingProvider } from '@/features/onboarding/OnboardingProvider';
import { I18nProvider } from '@/i18n/I18nProvider';
import { RootNavigator } from '@/navigation/RootNavigator';
import { configureNotificationHandling } from '@/platform/notifications/weeklyReflection';
import { RootErrorScreen } from '@/shared/components/RootErrorScreen';
import { ignoreError } from '@/shared/utils/function';

SplashScreen.preventAutoHideAsync().catch(ignoreError);
configureNotificationHandling().catch(ignoreError);

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <RootErrorScreen onRetry={retry} />;
}

export default function RootLayout() {
  return (
    <StrictMode>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ThemeProvider>
          <I18nProvider>
            <OnboardingProvider>
              <AppLockProvider>
                <RootNavigator />
              </AppLockProvider>
            </OnboardingProvider>
          </I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </StrictMode>
  );
}
