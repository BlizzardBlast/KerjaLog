import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';
import { initializeSentry } from '@/platform/observability/sentry';

jest.mock('@sentry/react-native', () => ({
  breadcrumbsIntegration: jest.fn((options) => ({ options })),
  deeplinkIntegration: jest.fn((options) => ({ options })),
  expoRouterIntegration: jest.fn((options) => ({ options })),
  init: jest.fn(),
  mobileReplayIntegration: jest.fn((options) => ({ options })),
}));

jest.mock('expo', () => ({
  isRunningInExpoGo: jest.fn(),
}));

const initMock = jest.mocked(Sentry.init);
const breadcrumbsIntegrationMock = jest.mocked(Sentry.breadcrumbsIntegration);
const deeplinkIntegrationMock = jest.mocked(Sentry.deeplinkIntegration);
const isRunningInExpoGoMock = jest.mocked(isRunningInExpoGo);
const initialDevMode = __DEV__;
const initialSentryEnvironment = process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT;

function getSentryOptions() {
  const [options] = initMock.mock.calls.at(-1) ?? [];

  if (!options) {
    throw new Error('Expected Sentry.init to be called.');
  }

  return options;
}

describe('Sentry privacy configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(globalThis, '__DEV__', {
      configurable: true,
      value: initialDevMode,
    });
    delete process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT;
    isRunningInExpoGoMock.mockReturnValue(false);
  });

  afterEach(() => {
    Object.defineProperty(globalThis, '__DEV__', {
      configurable: true,
      value: initialDevMode,
    });

    if (initialSentryEnvironment === undefined) {
      delete process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT;
    } else {
      process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT = initialSentryEnvironment;
    }
  });

  test('retains safe error context and redacts sensitive values', () => {
    // Given
    initializeSentry();
    const options = getSentryOptions();
    const errorEvent = {
      contexts: {
        feature: { note: 'private context note', screen: 'history' },
      },
      extra: {
        operation: 'save-work-entry',
        rawNote: 'private note',
        retry: { password: 'private-password', status: 'retrying' },
      },
      request: {
        cookies: { session: 'private-cookie' },
        data: { note: 'private note' },
        headers: { Authorization: 'Bearer private-token' },
        method: 'POST',
        query_string: 'token=private-token',
        url: 'https://example.test/v1/worklogs?token=private-token',
      },
      tags: {
        email: 'private@example.test',
        feature: 'work-entry',
      },
      type: undefined,
      user: {
        email: 'private@example.test',
        id: 'opaque-user-id',
        role: 'member',
        username: 'private-username',
      },
    };

    // When
    const sentEvent = options.beforeSend?.(errorEvent, {});

    // Then
    expect(sentEvent).toEqual({
      contexts: {
        feature: { note: '[Filtered]', screen: 'history' },
      },
      extra: {
        operation: 'save-work-entry',
        rawNote: '[Filtered]',
        retry: { password: '[Filtered]', status: 'retrying' },
      },
      request: {
        method: 'POST',
        url: 'https://example.test/v1/worklogs',
      },
      tags: {
        email: '[Filtered]',
        feature: 'work-entry',
      },
      type: undefined,
      user: { id: 'opaque-user-id', role: 'member' },
    });
    expect(errorEvent).toEqual({
      contexts: {
        feature: { note: 'private context note', screen: 'history' },
      },
      extra: {
        operation: 'save-work-entry',
        rawNote: 'private note',
        retry: { password: 'private-password', status: 'retrying' },
      },
      request: {
        cookies: { session: 'private-cookie' },
        data: { note: 'private note' },
        headers: { Authorization: 'Bearer private-token' },
        method: 'POST',
        query_string: 'token=private-token',
        url: 'https://example.test/v1/worklogs?token=private-token',
      },
      tags: {
        email: 'private@example.test',
        feature: 'work-entry',
      },
      type: undefined,
      user: {
        email: 'private@example.test',
        id: 'opaque-user-id',
        role: 'member',
        username: 'private-username',
      },
    });
  });

  test('redacts work-entry identifiers from JavaScript exception values', () => {
    // Given
    initializeSentry();
    const options = getSentryOptions();
    const errorEvent = {
      exception: {
        values: [
          {
            type: 'Error',
            value: 'Stored evidence for work entry entry-12345 is incomplete.',
          },
        ],
      },
      type: undefined,
    };

    // When
    const sentEvent = options.beforeSend?.(errorEvent, {});

    // Then
    expect(sentEvent).toEqual({
      exception: {
        values: [
          {
            type: 'Error',
            value: 'Stored evidence for work entry [Filtered] is incomplete.',
          },
        ],
      },
      type: undefined,
    });
    expect(errorEvent.exception.values[0]?.value).toBe(
      'Stored evidence for work entry entry-12345 is incomplete.',
    );
  });

  test('redacts quoted and unquoted sensitive key-value text', () => {
    initializeSentry();
    const options = getSentryOptions();

    const breadcrumb = options.beforeBreadcrumb?.({
      category: 'custom',
      message:
        'password: private api_key=secret "raw_note":"private note" authorization: Bearer private-token status=ok',
    });

    expect(breadcrumb).toEqual({
      category: 'custom',
      message:
        'password: [Filtered] api_key=[Filtered] "raw_note":"[Filtered]" authorization: [Filtered] status=ok',
    });
  });

  test('redacts architecture-defined career content key variants', () => {
    initializeSentry();
    const options = getSentryOptions();

    const sentEvent = options.beforeSend?.(
      {
        extra: {
          company: 'Private employer',
          companyName: 'Private employer name',
          impact_statement: 'Private impact statement',
          project: 'Private project',
          projectName: 'Private project name',
          reviewContent: 'Private review content',
          safeOperation: 'load-history',
        },
        type: undefined,
      },
      {},
    );

    expect(sentEvent).toEqual({
      extra: {
        company: '[Filtered]',
        companyName: '[Filtered]',
        impact_statement: '[Filtered]',
        project: '[Filtered]',
        projectName: '[Filtered]',
        reviewContent: '[Filtered]',
        safeOperation: 'load-history',
      },
      type: undefined,
    });
  });

  test('retains safe transaction context and redacts sensitive values', () => {
    // Given
    initializeSentry();
    const options = getSentryOptions();
    const transactionEvent = {
      contexts: {
        workflow: { feedback: 'private feedback', screen: 'history' },
      },
      extra: { evidence: 'private evidence', operation: 'load-history' },
      request: {
        method: 'GET',
        url: 'https://example.test/v1/worklogs?token=private-token',
      },
      tags: { feature: 'history', token: 'private-token' },
      type: 'transaction' as const,
      user: { id: 'opaque-user-id', ip_address: '192.0.2.1' },
    };

    // When
    const sentEvent = options.beforeSendTransaction?.(transactionEvent, {});

    // Then
    expect(sentEvent).toEqual({
      contexts: {
        workflow: { feedback: '[Filtered]', screen: 'history' },
      },
      extra: { evidence: '[Filtered]', operation: 'load-history' },
      request: {
        method: 'GET',
        url: 'https://example.test/v1/worklogs',
      },
      tags: { feature: 'history', token: '[Filtered]' },
      type: 'transaction',
      user: { id: 'opaque-user-id' },
    });
    expect(transactionEvent).toEqual({
      contexts: {
        workflow: { feedback: 'private feedback', screen: 'history' },
      },
      extra: { evidence: 'private evidence', operation: 'load-history' },
      request: {
        method: 'GET',
        url: 'https://example.test/v1/worklogs?token=private-token',
      },
      tags: { feature: 'history', token: 'private-token' },
      type: 'transaction',
      user: { id: 'opaque-user-id', ip_address: '192.0.2.1' },
    });
  });

  test('drops console breadcrumbs and sanitizes network and deep-link URLs', () => {
    // Given
    initializeSentry();
    const options = getSentryOptions();

    // When
    const consoleBreadcrumb = options.beforeBreadcrumb?.({
      category: 'console',
      data: {
        arguments: ['Prepared confidential promotion notes for a colleague'],
      },
      message: 'Prepared confidential promotion notes for a colleague',
    });
    const requestBreadcrumb = options.beforeBreadcrumb?.({
      category: 'xhr',
      data: {
        authorization: 'Bearer private-token',
        method: 'POST',
        url: 'https://api.example.test/v1/worklogs?token=private-token',
      },
    });
    const deepLinkBreadcrumb = options.beforeBreadcrumb?.({
      category: 'deeplink',
      data: {
        url: 'kerjalog://entry/opaque-entry-key/edit?token=private-token',
      },
      message: 'kerjalog://entry/opaque-entry-key/edit?token=private-token',
    });
    const touchBreadcrumb = options.beforeBreadcrumb?.({
      category: 'ui.click',
    });

    // Then
    expect(consoleBreadcrumb).toBeNull();
    expect(requestBreadcrumb).toEqual({
      category: 'xhr',
      data: {
        authorization: '[Filtered]',
        method: 'POST',
        url: 'https://api.example.test/v1/worklogs',
      },
    });
    expect(deepLinkBreadcrumb).toEqual({
      category: 'deeplink',
      data: {
        url: 'kerjalog://entry/[id]/edit',
      },
      message: 'kerjalog://entry/[id]/edit',
    });
    expect(touchBreadcrumb).toEqual({ category: 'ui.click' });
  });

  test('keeps telemetry collection inside explicit privacy boundaries', () => {
    // Given
    initializeSentry();
    const options = getSentryOptions();

    // When
    const breadcrumbsIntegration = breadcrumbsIntegrationMock.mock.calls.at(-1);

    // Then
    expect(options.sendDefaultPii).toBe(false);
    expect(options.tracePropagationTargets).toEqual([]);
    expect(breadcrumbsIntegration).toEqual([
      {
        console: false,
        fetch: false,
        xhr: true,
      },
    ]);
  });

  test('labels preview builds explicitly', () => {
    // Given
    process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT = 'preview';

    // When
    initializeSentry();
    const options = getSentryOptions();

    // Then
    expect(options.environment).toBe('preview');
  });

  test('disables native frame timing inside Expo Go', () => {
    // Given
    isRunningInExpoGoMock.mockReturnValue(true);

    // When
    initializeSentry();
    const options = getSentryOptions();

    // Then
    expect(options.enableNativeFramesTracking).toBe(false);
    expect(options.profilesSampleRate).toBeUndefined();
    expect(Sentry.expoRouterIntegration).toHaveBeenCalledWith({
      enableTimeToInitialDisplay: false,
    });
  });

  test('enables native profiling, deep-link tracing, and interaction tracing', () => {
    // Given
    initializeSentry();
    const options = getSentryOptions();

    // Then
    expect(options.environment).toBe('development');
    expect(options.profilesSampleRate).toBe(1);
    expect(options.enableUserInteractionTracing).toBe(true);
    expect(options._experiments).toEqual({
      enableStandaloneAppStartTracing: true,
    });
    expect(deeplinkIntegrationMock).toHaveBeenCalledWith();
  });

  test('samples native production profiles relative to sampled traces', () => {
    // Given
    Object.defineProperty(globalThis, '__DEV__', {
      configurable: true,
      value: false,
    });

    // When
    initializeSentry();
    const options = getSentryOptions();

    // Then
    expect(options.environment).toBe('production');
    expect(options.tracesSampleRate).toBe(0.1);
    expect(options.profilesSampleRate).toBe(0.1);
  });
});
