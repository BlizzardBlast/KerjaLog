import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';

const PRIVATE_BREADCRUMB_CATEGORIES = new Set([
  'console',
  'fetch',
  'http',
  'xhr',
]);

export function initializeSentry(): void {
  const runningInExpoGo = isRunningInExpoGo();

  Sentry.init({
    dsn: 'https://14ee0c9c15f1270cd72c729104c5df0c@o4511942233227264.ingest.us.sentry.io/4511942238666752',
    sendDefaultPii: false,
    tracesSampleRate: __DEV__ ? 1 : 0.2,
    tracePropagationTargets: [],
    enableNativeFramesTracking: !runningInExpoGo,
    enableLogs: true,
    enableAutoConsoleLogs: false,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1,
    beforeBreadcrumb(breadcrumb) {
      return PRIVATE_BREADCRUMB_CATEGORIES.has(breadcrumb.category ?? '')
        ? null
        : breadcrumb;
    },
    beforeSend({ extra: _extra, request: _request, user: _user, ...event }) {
      return event;
    },
    beforeSendTransaction({
      extra: _extra,
      request: _request,
      user: _user,
      ...event
    }) {
      return event;
    },
    integrations: [
      Sentry.breadcrumbsIntegration({
        console: false,
        fetch: false,
        xhr: false,
      }),
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
}
