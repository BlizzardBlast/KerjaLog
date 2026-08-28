import type { Breadcrumb } from '@sentry/react-native';
import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';

const FILTERED_VALUE = '[Filtered]';
const PRODUCTION_TRACES_SAMPLE_RATE = 0.1;
const PRODUCTION_PROFILES_SAMPLE_RATE = 0.1;
const WORK_ENTRY_ROUTE_PATTERN = /(^|\/)entry\/[^/?#]+(?=\/|$)/gi;
const QUOTED_FIELD_VALUE_PATTERN =
  /(["']?)([a-z][a-z0-9_-]*)(["']?\s*:\s*["'])([^"']*)/gi;
const UNQUOTED_FIELD_VALUE_PATTERN =
  /([a-z][a-z0-9_-]*)(\s*[:=]\s*)(?:Bearer\s+)?([^,\s;]+)/gi;
const SENSITIVE_FIELD_KEYS = new Set([
  'accountnumber',
  'address',
  'apikey',
  'authorization',
  'birth',
  'birthdate',
  'cardnumber',
  'cif',
  'content',
  'cookie',
  'cvv',
  'description',
  'email',
  'evidence',
  'feedback',
  'ipaddress',
  'name',
  'note',
  'otp',
  'passcode',
  'password',
  'phone',
  'pin',
  'rawnote',
  'secret',
  'sessionid',
  'text',
  'token',
  'userid',
  'username',
  'workentry',
]);
const WORK_ENTRY_REFERENCE_MARKERS = [
  'work entry id ',
  'work-entry id ',
  'work_entry id ',
  'workentry id ',
  'work entry ',
  'work-entry ',
  'work_entry ',
  'workentry ',
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

function normalizeFieldKey(key: string): string {
  return key.replaceAll('-', '').replaceAll('_', '').toLowerCase();
}

function isSensitiveFieldKey(key: string): boolean {
  return SENSITIVE_FIELD_KEYS.has(normalizeFieldKey(key));
}

function redactText(value: string): string {
  const quotedValuesRedacted = value.replace(
    QUOTED_FIELD_VALUE_PATTERN,
    (match, openingQuote: string, key: string, separator: string) =>
      isSensitiveFieldKey(key)
        ? `${openingQuote}${key}${separator}${FILTERED_VALUE}`
        : match,
  );

  return quotedValuesRedacted.replace(
    UNQUOTED_FIELD_VALUE_PATTERN,
    (match, key: string, separator: string) =>
      isSensitiveFieldKey(key) ? `${key}${separator}${FILTERED_VALUE}` : match,
  );
}

function isAlphaNumeric(character: string | undefined): boolean {
  if (!character) {
    return false;
  }

  return (
    (character >= 'a' && character <= 'z') ||
    (character >= 'A' && character <= 'Z') ||
    (character >= '0' && character <= '9')
  );
}

function isWorkEntryIdCharacter(character: string | undefined): boolean {
  return isAlphaNumeric(character) || character === '-' || character === '_';
}

function redactTokenAfterMarker(value: string, marker: string): string {
  let result = value;
  let searchFrom = 0;

  while (searchFrom < result.length) {
    const markerIndex = result.toLowerCase().indexOf(marker, searchFrom);
    if (markerIndex < 0) {
      break;
    }

    const tokenStart = markerIndex + marker.length;
    let tokenEnd = tokenStart;
    while (isWorkEntryIdCharacter(result[tokenEnd])) {
      tokenEnd += 1;
    }

    const token = result.slice(tokenStart, tokenEnd);
    if (token.length >= 8 && isAlphaNumeric(token[0])) {
      result =
        result.slice(0, tokenStart) + FILTERED_VALUE + result.slice(tokenEnd);
      searchFrom = tokenStart + FILTERED_VALUE.length;
    } else {
      searchFrom = Math.max(tokenEnd, tokenStart + 1);
    }
  }

  return result;
}

function redactExceptionText(value: string): string {
  return WORK_ENTRY_REFERENCE_MARKERS.reduce(
    (redactedValue, marker) => redactTokenAfterMarker(redactedValue, marker),
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

function redactObjectEntry(
  key: string,
  entry: unknown,
  seen: WeakSet<object>,
): unknown {
  if (isSensitiveFieldKey(key)) {
    return FILTERED_VALUE;
  }

  if (key === 'url' && typeof entry === 'string') {
    return redactUrl(entry);
  }

  return redactBreadcrumbValue(entry, seen);
}

function redactObject(
  value: object,
  seen: WeakSet<object>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      redactObjectEntry(key, entry, seen),
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
  let message: string | undefined;
  if (breadcrumb.message) {
    message =
      breadcrumb.category === 'deeplink'
        ? redactUrl(breadcrumb.message)
        : redactText(breadcrumb.message);
  }

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
