import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';
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

const runningInExpoGo = isRunningInExpoGo();

Sentry.init({
  dsn: 'https://14ee0c9c15f1270cd72c729104c5df0c@o4511942233227264.ingest.us.sentry.io/4511942238666752',
  sendDefaultPii: false,
  tracesSampleRate: __DEV__ ? 1 : 0.2,
  enableNativeFramesTracking: !runningInExpoGo,
  enableLogs: true,
  enableAutoConsoleLogs: false,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.expoRouterIntegration({
      enableTimeToInitialDisplay: !runningInExpoGo,
    }),
    Sentry.mobileReplayIntegration({
      maskAllText: true,
      maskAllImages: true,
      maskAllVectors: true,
    }),
  ],
});

SplashScreen.preventAutoHideAsync().catch(ignoreError);
configureNotificationHandling().catch(ignoreError);

function RootErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <RootErrorScreen onRetry={retry} />;
}

export const ErrorBoundary =
  Sentry.wrapExpoRouterErrorBoundary(RootErrorBoundary);

function RootLayout() {
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

export default Sentry.wrap(RootLayout);
