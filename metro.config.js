const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname, {
  annotateReactComponents: true,
  autoWrapExpoRouterErrorBoundary: true,
});

module.exports = config;
