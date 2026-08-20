import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';
import { initializeSentry } from '@/platform/observability/sentry';

jest.mock('@sentry/react-native', () => ({
  breadcrumbsIntegration: jest.fn((options) => ({ options })),
  expoRouterIntegration: jest.fn((options) => ({ options })),
  init: jest.fn(),
  mobileReplayIntegration: jest.fn((options) => ({ options })),
}));

jest.mock('expo', () => ({
  isRunningInExpoGo: jest.fn(),
}));

const initMock = jest.mocked(Sentry.init);
const breadcrumbsIntegrationMock = jest.mocked(Sentry.breadcrumbsIntegration);
const isRunningInExpoGoMock = jest.mocked(isRunningInExpoGo);

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
    isRunningInExpoGoMock.mockReturnValue(false);
  });

  test('removes sensitive data from JavaScript error events', () => {
    // Given
    initializeSentry();
    const options = getSentryOptions();
    const errorEvent = {
      extra: { rawNote: 'private note' },
      request: { url: 'https://example.test/?token=private' },
      type: undefined,
      user: { email: 'private@example.test' },
    };

    // When
    const sentEvent = options.beforeSend?.(errorEvent, {});

    // Then
    expect(sentEvent).toEqual({ type: undefined });
    expect(errorEvent).toEqual({
      extra: { rawNote: 'private note' },
      request: { url: 'https://example.test/?token=private' },
      type: undefined,
      user: { email: 'private@example.test' },
    });
  });

  test('removes sensitive data from JavaScript transaction events', () => {
    // Given
    initializeSentry();
    const options = getSentryOptions();
    const transactionEvent = {
      extra: { evidence: 'private evidence' },
      request: { url: 'https://example.test/?token=private' },
      type: 'transaction' as const,
      user: { id: 'private-user-id' },
    };

    // When
    const sentEvent = options.beforeSendTransaction?.(transactionEvent, {});

    // Then
    expect(sentEvent).toEqual({ type: 'transaction' });
    expect(transactionEvent).toEqual({
      extra: { evidence: 'private evidence' },
      request: { url: 'https://example.test/?token=private' },
      type: 'transaction',
      user: { id: 'private-user-id' },
    });
  });

  test('drops console and HTTP breadcrumbs', () => {
    // Given
    initializeSentry();
    const options = getSentryOptions();

    // When
    const consoleBreadcrumb = options.beforeBreadcrumb?.({
      category: 'console',
    });
    const requestBreadcrumb = options.beforeBreadcrumb?.({ category: 'xhr' });
    const touchBreadcrumb = options.beforeBreadcrumb?.({
      category: 'ui.click',
    });

    // Then
    expect(consoleBreadcrumb).toBeNull();
    expect(requestBreadcrumb).toBeNull();
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
        xhr: false,
      },
    ]);
  });

  test('disables native frame timing inside Expo Go', () => {
    // Given
    isRunningInExpoGoMock.mockReturnValue(true);

    // When
    initializeSentry();
    const options = getSentryOptions();

    // Then
    expect(options.enableNativeFramesTracking).toBe(false);
    expect(Sentry.expoRouterIntegration).toHaveBeenCalledWith({
      enableTimeToInitialDisplay: false,
    });
  });
});
