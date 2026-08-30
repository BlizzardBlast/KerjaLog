import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';
import {
  redactBreadcrumb,
  redactEventException,
  redactEventMetadata,
} from '@/platform/observability/sentryPrivacy';

const PRODUCTION_TRACES_SAMPLE_RATE = 0.1;
const PRODUCTION_PROFILES_SAMPLE_RATE = 0.1;

type SentryEnvironment = 'development' | 'preview' | 'production';

function getSentryEnvironment(): SentryEnvironment {
  const configuredEnvironment = process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT;

  if (
    configuredEnvironment === 'development' ||
    configuredEnvironment === 'preview' ||
    configuredEnvironment === 'production'
  ) {
    return configuredEnvironment;
  }

  return __DEV__ ? 'development' : 'production';
}

export function initializeSentry(): void {
  const runningInExpoGo = isRunningInExpoGo();

  Sentry.init({
    dsn: 'https://bb2a08ee78d2da8d245c58cd125eacf5@o4511942233227264.ingest.us.sentry.io/4511946505781248',
    environment: getSentryEnvironment(),
    sendDefaultPii: false,
    tracesSampleRate: __DEV__ ? 1 : PRODUCTION_TRACES_SAMPLE_RATE,
    ...(runningInExpoGo
      ? {}
      : {
          profilesSampleRate: __DEV__ ? 1 : PRODUCTION_PROFILES_SAMPLE_RATE,
        }),
    tracePropagationTargets: [],
    enableNativeFramesTracking: !runningInExpoGo,
    enableLogs: true,
    enableAutoConsoleLogs: false,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1,
    replaysSessionQuality: 'low',
    enableUserInteractionTracing: true,
    beforeBreadcrumb(breadcrumb) {
      return redactBreadcrumb(breadcrumb);
    },
    beforeSend({ contexts, exception, extra, request, tags, user, ...event }) {
      return {
        ...event,
        ...redactEventMetadata(contexts, extra, request, tags, user),
        ...(exception ? { exception: redactEventException(exception) } : {}),
      };
    },
    beforeSendTransaction({ contexts, extra, request, tags, user, ...event }) {
      return {
        ...event,
        ...redactEventMetadata(contexts, extra, request, tags, user),
      };
    },
    integrations: [
      Sentry.breadcrumbsIntegration({
        console: false,
        fetch: false,
        xhr: true,
      }),
      Sentry.deeplinkIntegration(),
      Sentry.expoRouterIntegration({
        enableTimeToInitialDisplay: !runningInExpoGo,
      }),
      Sentry.mobileReplayIntegration({
        maskAllText: true,
        maskAllImages: true,
        maskAllVectors: true,
      }),
    ],
    _experiments: {
      enableStandaloneAppStartTracing: true,
    },
  });
}
