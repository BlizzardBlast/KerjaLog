import type { Breadcrumb } from '@sentry/react-native';
import type * as Sentry from '@sentry/react-native';
import {
  isSensitiveFieldKey,
  redactExceptionText,
  redactText,
  redactUrl,
} from '@/platform/observability/sentryTextRedaction';

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
    return '[Filtered]';
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

export function redactEventException(
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

export function redactEventMetadata(
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

export function redactBreadcrumb(
  breadcrumb: Breadcrumb,
): Breadcrumb | null {
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
