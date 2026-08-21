import type { Breadcrumb } from '@sentry/react-native';
import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';

const FILTERED_VALUE = '[Filtered]';
const SENSITIVE_BREADCRUMB_KEY =
  /^(account[-_]?number|address|api[-_]?key|authorization|birth(?:date)?|card[-_]?number|cif|content|cookie|cvv|description|email|evidence|feedback|ip[-_]?address|name|note|otp|passcode|password|phone|pin|raw[-_]?note|secret|session[-_]?id|text|token|user[-_]?id|username|work[-_]?entry)$/i;
const SENSITIVE_BREADCRUMB_TEXT_PATTERNS = [
  /((?:account[-_]?number|address|api[-_]?key|authorization|birth(?:date)?|card[-_]?number|cif|content|cookie|cvv|description|email|evidence|feedback|ip[-_]?address|name|note|otp|passcode|password|phone|pin|raw[-_]?note|secret|session[-_]?id|text|token|user[-_]?id|username|work[-_]?entry)\s*(?:=|:)\s*)(?:Bearer\s+)?[^,\s;]+/gi,
  /((?:"|')?(?:account[-_]?number|address|api[-_]?key|authorization|birth(?:date)?|card[-_]?number|cif|content|cookie|cvv|description|email|evidence|feedback|ip[-_]?address|name|note|otp|passcode|password|phone|pin|raw[-_]?note|secret|session[-_]?id|text|token|user[-_]?id|username|work[-_]?entry)(?:"|')?\s*:\s*["'])[^"']*/gi,
] as const;

function redactText(value: string): string {
  return SENSITIVE_BREADCRUMB_TEXT_PATTERNS.reduce(
    (redactedValue, pattern) =>
      redactedValue.replace(pattern, `$1${FILTERED_VALUE}`),
    value,
  );
}

function redactUrl(value: string): string {
  try {
    const url = new URL(value);

    return `${url.origin}${url.pathname}`;
  } catch {
    const [path] = value.split(/[?#]/, 1);

    return path ?? value;
  }
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
    ...redactObject(safeUser, new WeakSet<object>()),
    ...(id ? { id } : {}),
  };
}

function redactEventMetadata(
  extra: Sentry.Event['extra'],
  request: Sentry.Event['request'],
  user: Sentry.Event['user'],
) {
  return {
    ...(extra ? { extra: redactObject(extra, new WeakSet<object>()) } : {}),
    ...(request ? { request: redactEventRequest(request) } : {}),
    ...(user ? { user: redactEventUser(user) } : {}),
  };
}

function redactBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  const data = breadcrumb.data
    ? redactBreadcrumbValue(breadcrumb.data, new WeakSet<object>())
    : undefined;
  const message = breadcrumb.message
    ? redactText(breadcrumb.message)
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
    dsn: 'https://14ee0c9c15f1270cd72c729104c5df0c@o4511942233227264.ingest.us.sentry.io/4511942238666752',
    sendDefaultPii: false,
    tracesSampleRate: __DEV__ ? 1 : 0.2,
    ...(runningInExpoGo ? {} : { profilesSampleRate: __DEV__ ? 1 : 0.1 }),
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
    beforeSend({ extra, request, user, ...event }) {
      return {
        ...event,
        ...redactEventMetadata(extra, request, user),
      };
    },
    beforeSendTransaction({ extra, request, user, ...event }) {
      return {
        ...event,
        ...redactEventMetadata(extra, request, user),
      };
    },
    integrations: [
      Sentry.breadcrumbsIntegration({
        console: true,
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
