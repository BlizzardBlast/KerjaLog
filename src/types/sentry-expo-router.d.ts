import type { ImperativeRouter } from 'expo-router';

declare module '@sentry/react-native' {
  function wrapExpoRouter<Router extends ImperativeRouter>(
    router: Router,
  ): Router;
}
