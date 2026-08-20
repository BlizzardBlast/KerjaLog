import * as Sentry from '@sentry/react-native';
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

Sentry.init({
  dsn: 'https://14ee0c9c15f1270cd72c729104c5df0c@o4511942233227264.ingest.us.sentry.io/4511942238666752',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

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
