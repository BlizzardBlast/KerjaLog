import type { Breadcrumb } from '@sentry/react-native';
import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';

const FILTERED_VALUE = '[Filtered]';
const PRODUCTION_TRACES_SAMPLE_RATE = 0.1;
const PRODUCTION_PROFILES_SAMPLE_RATE = 0.1;
const WORK_ENTRY_ROUTE_PATTERN = /(^|\/)entry\/[^/?#]+(?=\/|$)/gi;
const SENSITIVE_BREADCRUMB_KEY =
  /^(account[-_]?number|address|api[-_]?key|authorization|birth(?:date)?|card[-_]?number|cif|content|cookie|cvv|description|email|evidence|feedback|ip[-_]?address|name|note|otp|passcode|password|phone|pin|raw[-_]?note|secret|session[-_]?id|text|token|user[-_]?id|username|work[-_]?entry)$/i;
const SENSITIVE_BREADCRUMB_TEXT_PATTERNS = [
  /((?:account[-_]?number|address|api[-_]?key|authorization|birth(?:date)?|card[-_]?number|cif|content|cookie|cvv|description|email|evidence|feedback|ip[-_]?address|name|note|otp|passcode|password|phone|pin|raw[-_]?note|secret|session[-_]?id|text|token|user[-_]?id|username|work[-_]?entry)\s*(?:=|:)\s*)(?:Bearer\s+)?[^,\s;]+/gi,
  /((?:"|')?(?:account[-_]?number|address|api[-_]?key|authorization|birth(?:date)?|card[-_]?number|cif|content|cookie|cvv|description|email|evidence|feedback|ip[-_]?address|name|note|otp|passcode|password|phone|pin|raw[-_]?note|secret|session[-_]?id|text|token|user[-_]?id|username|work[-_]?entry)(?:"|')?\s*:\s*["'])[^"']*/gi,
] as const;
const SENSITIVE_EXCEPTION_TEXT_PATTERNS = [
  /(\bwork[-_ ]?entry(?:\s+id)?\s+)[a-z0-9][a-z0-9_-]{7,}\b/gi,
] as const;

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

function redactText(value: string): string {
  return SENSITIVE_BREADCRUMB_TEXT_PATTERNS.reduce(
    (redactedValue, pattern) =>
      redactedValue.replace(pattern, `$1${FILTERED_VALUE}`),
    value,
  );
}

function redactExceptionText(value: string): string {
  return SENSITIVE_EXCEPTION_TEXT_PATTERNS.reduce(
    (redactedValue, pattern) =>
      redactedValue.replace(pattern, `$1${FILTERED_VALUE}`),
    redactText(value),
  );
}

function redactUrl(value: string): string {
  const [urlWithoutQueryOrFragment] = value.split(/[?#]/, 1);
  const safeUrl = urlWithoutQueryOrFragment ?? value;

  return safeUrl.replace(WORK_ENTRY_ROUTE_PATTERN, '$1entry/[id]');
}

function redactBreadcrumbValue(value: unknown, seen: WeakSet<object>): unknown {
  if (typeof value === 'string') {
    return redactText(value);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return '[Circular]';
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((entry) => redactBreadcrumbValue(entry, seen));
  }

  return redactObject(value, seen);
}

function redactObject(
  value: object,
  seen: WeakSet<object>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_BREADCRUMB_KEY.test(key)
        ? FILTERED_VALUE
        : key === 'url' && typeof entry === 'string'
          ? redactUrl(entry)
          : redactBreadcrumbValue(entry, seen),
    ]),
  );
}

function redactEventObject<Value extends object>(value: Value): Value {
  return redactObject(value, new WeakSet<object>()) as Value;
}

function redactEventRequest(request: NonNullable<Sentry.Event['request']>) {
  const {
    cookies: _cookies,
    data: _data,
    env: _env,
    headers: _headers,
    query_string: _queryString,
    url,
    ...safeRequest
  } = request;

  return {
    ...safeRequest,
    ...(url ? { url: redactUrl(url) } : {}),
  };
}

function redactEventUser(user: NonNullable<Sentry.Event['user']>) {
  const {
    email: _email,
    geo: _geo,
    id,
    ip_address: _ipAddress,
    username: _username,
    ...safeUser
  } = user;

  return {
    ...redactEventObject(safeUser),
    ...(id ? { id } : {}),
  };
}

function redactEventException(
  exception: NonNullable<Sentry.Event['exception']>,
) {
  if (!exception.values) {
    return exception;
  }

  return {
    ...exception,
    values: exception.values.map(({ value, ...exceptionValue }) => ({
      ...exceptionValue,
      ...(value ? { value: redactExceptionText(value) } : {}),
    })),
  };
}

function redactEventMetadata(
  contexts: Sentry.Event['contexts'],
  extra: Sentry.Event['extra'],
  request: Sentry.Event['request'],
  tags: Sentry.Event['tags'],
  user: Sentry.Event['user'],
) {
  return {
    ...(contexts ? { contexts: redactEventObject(contexts) } : {}),
    ...(extra ? { extra: redactEventObject(extra) } : {}),
    ...(request ? { request: redactEventRequest(request) } : {}),
    ...(tags ? { tags: redactEventObject(tags) } : {}),
    ...(user ? { user: redactEventUser(user) } : {}),
  };
}

function redactBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  if (breadcrumb.category === 'console') {
    return null;
  }

  const data = breadcrumb.data
    ? redactBreadcrumbValue(breadcrumb.data, new WeakSet<object>())
    : undefined;
  const message = breadcrumb.message
    ? breadcrumb.category === 'deeplink'
      ? redactUrl(breadcrumb.message)
      : redactText(breadcrumb.message)
    : undefined;

  return {
    ...breadcrumb,
    ...(data ? { data } : {}),
    ...(message ? { message } : {}),
  };
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
