jest.mock('react-native-worklets', () =>
  require('react-native-worklets/lib/module/mock'),
);

jest.mock('@sentry/react-native', () => {
  const identity = (component) => component;

  return {
    breadcrumbsIntegration: jest.fn((options) => ({ options })),
    deeplinkIntegration: jest.fn((options) => ({ options })),
    expoRouterIntegration: jest.fn((options) => ({ options })),
    init: jest.fn(),
    mobileReplayIntegration: jest.fn((options) => ({ options })),
    withProfiler: identity,
    wrap: identity,
    wrapExpoRouter: (router) => router,
    wrapExpoRouterErrorBoundary: identity,
  };
});

require('react-native-reanimated').setUpTests();
