# Sentry operations

KerjaLog uses `@sentry/react-native` with Expo, Expo Router, and Continuous Native Generation.

## Runtime privacy defaults

The runtime configuration is intentionally conservative because KerjaLog stores private career notes:

- default PII collection is disabled;
- Expo Router reports templated route names without concrete route parameters;
- Session Replay uploads only when an error occurs;
- replay text, images, and vectors remain masked;
- automatic console-log ingestion is disabled;
- screenshots, view hierarchy attachments, request/response bodies, and request headers are not enabled.

Do not add work-entry text, evidence, feedback, user-entered values, authentication material, or database contents to Sentry messages, tags, breadcrumbs, logs, or custom contexts.

## Source maps and debug symbols

The Expo config plugin in `app.json` and the Sentry Metro configuration in `metro.config.js` enable automatic source-map/debug-symbol handling for native release builds.

Source-map uploads require a Sentry organization auth token named `SENTRY_AUTH_TOKEN` in the build environment.

- For EAS Build, store `SENTRY_AUTH_TOKEN` as a sensitive/secret EAS environment variable. Never place the token in `app.json`, `eas.json`, or an `EXPO_PUBLIC_*` variable.
- For local release builds, put the token in a gitignored local environment file such as `.env.local` or `.env.sentry-build-plugin`, or export it only for the build process.
- The Sentry DSN in application code is a public ingestion identifier, not the source-map upload credential.

The configured Sentry organization and project slugs are `blizzard-dw` and `react-native`. If either slug changes in Sentry, update the `@sentry/react-native/expo` plugin configuration in `app.json` before the next release build.

## Expo Router tracing

`expoRouterIntegration` is configured in the root layout. It records navigation transactions without manual React Navigation container registration. Native frame tracking and Time to Initial Display are disabled in Expo Go because those measurements require a native build.

The Metro transform is also configured to wrap Expo Router `ErrorBoundary` re-exports. KerjaLog's custom root route error boundary is wrapped explicitly so handled render errors are still reported to Sentry while keeping the existing fallback UI.

## Sampling

Development tracing is sampled at 100% to make instrumentation easier to verify. Non-development builds sample 20% of performance traces.

Normal sessions are not uploaded as Session Replays. When an error occurs, Sentry may upload the buffered error replay with masking enabled.

Review sampling after real production traffic is available. Raise or lower trace sampling based on debugging value, event volume, and Sentry quota rather than treating the initial value as permanent.

## Verification before release

1. Run the repository validation command (`pnpm check`).
2. Produce a native release/EAS build with `SENTRY_AUTH_TOKEN` available to the build environment.
3. Temporarily trigger a controlled `Sentry.captureException(new Error('Sentry verification error'))` from a development-only action.
4. Confirm the event is symbolicated in Sentry and contains the expected release/build information.
5. Navigate between several Expo Router routes and confirm navigation transactions use templated route names rather than private route parameters.
6. Confirm any error replay remains masked.
7. Remove the temporary verification action before shipping.

## EAS Update

KerjaLog does not currently depend on `expo-updates`, so no EAS Update source-map upload workflow is configured. If OTA updates are added later, export/update source maps must also be uploaded to Sentry according to the current Sentry Expo Update guidance.
