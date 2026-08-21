# Sentry operations

KerjaLog uses `@sentry/react-native` with Expo, Expo Router, and Continuous Native Generation.

## Runtime privacy defaults

The runtime configuration is intentionally conservative because KerjaLog stores private career notes:

- default PII collection is disabled;
- Expo Router reports templated route names without concrete route parameters;
- Session Replay uploads only when an error occurs;
- replay text, images, and vectors remain masked;
- JavaScript console and XHR breadcrumbs are retained for debugging; sensitive keys and matching message values are filtered, and URL query strings/fragments are removed;
- JavaScript error and transaction events retain safe contexts, opaque user IDs, request methods, and request paths; headers, cookies, bodies, query strings, and sensitive fields are removed;
- deep-link breadcrumbs retain the route needed for debugging, while `sendDefaultPii: false` removes query strings and ID-like path segments;
- trace-propagation headers are disabled until a first-party backend origin is explicitly allowlisted;
- screenshots, view hierarchy attachments, request/response bodies, and request headers are not enabled.

Do not add work-entry text, evidence, feedback, user-entered values, authentication material, or database contents to Sentry messages, tags, breadcrumbs, logs, or custom contexts. If identifying a signed-in user, use only an opaque, non-reversible ID; never send names, emails, usernames, or IP addresses.

KerjaLog currently uses React Native's standard XHR-backed `fetch`, so only XHR breadcrumbs are enabled to prevent duplicate network trails. If the app adopts `expo/fetch`, revisit this setting and enable `fetch` as well.

`beforeSend` and `beforeSendTransaction` apply only to JavaScript events. Keep Sentry's server-side data-scrubbing rules enabled as a second layer, covering credentials, personal data, and any future network query parameters. Native crash payloads are not filtered by these JavaScript hooks.

## Source maps and debug symbols

The Expo config plugin in `app.json` and the Sentry Metro configuration in `metro.config.js` enable automatic source-map/debug-symbol handling for native release builds.

Source-map uploads require a Sentry organization auth token named `SENTRY_AUTH_TOKEN` in the build environment.

- For EAS Build, store `SENTRY_AUTH_TOKEN` as a sensitive/secret EAS environment variable. Never place the token in `app.json`, `eas.json`, or an `EXPO_PUBLIC_*` variable.
- For local release builds, put the token in a gitignored local environment file such as `.env.local` or `.env.sentry-build-plugin`, or export it only for the build process.
- The Sentry DSN in application code is a public ingestion identifier, not the source-map upload credential.

The `@sentry/react-native/expo` plugin configuration in `app.json` is the single source of truth for the Sentry organization and project. If either slug changes, update that plugin configuration before the next release build.

## Expo Router tracing

`expoRouterIntegration` is configured in the root layout. It records navigation transactions without manual React Navigation container registration. Native frame tracking and Time to Initial Display are disabled in Expo Go because those measurements require a native build.

Every imperative `useRouter()` call is wrapped with `Sentry.wrapExpoRouter`: tabs, onboarding, home, history, log flow, log, saved entry, edit entry, and refinement editor. This preserves router behavior while adding navigation breadcrumbs and dispatch spans.

Component render spans use `Sentry.withProfiler` only around the root layout and route-level onboarding, home, history, log, saved-entry, and edit-entry screens. Leaf and workflow components remain unwrapped to keep performance data actionable.

The Metro transform is also configured to wrap Expo Router `ErrorBoundary` re-exports. KerjaLog's custom root route error boundary is wrapped explicitly so handled render errors are still reported to Sentry while keeping the existing fallback UI.

KerjaLog supports iOS and Android only. Metro excludes Sentry's web Feedback and Replay code; mobile error replay remains enabled with masking.

## Sampling

Development tracing is sampled at 100% to make instrumentation easier to verify. Non-development builds sample 20% of performance traces.

Native development builds profile 100% of sampled transactions. Production profiles sample 10% of the already sampled traces, so the effective production profile rate is 2% of all transactions (`0.2 × 0.1`). Profiling is omitted in Expo Go because Hermes/native profiling requires a development or release build. Sentry's automatic native profiling integration is used; experimental continuous UI profiling is not enabled.

Normal sessions are not uploaded as Session Replays. When an error occurs, Sentry may upload the buffered error replay with masking enabled.

Review sampling after real production traffic is available. Raise or lower trace sampling based on debugging value, event volume, and Sentry quota rather than treating the initial value as permanent.

## EAS Size Analysis and Insights

`eas-build-on-success` first runs `scripts/upload-sentry-size-analysis.cjs`, then sends Sentry's successful-build event. `eas-build-on-error` remains responsible for failed-build events; there is no `eas-build-on-complete` hook, preventing duplicate failed-build events.

The upload hook runs only for successful `preview` and `production` EAS builds. It reads the organization and project from the Expo plugin configuration, uploads exactly one Android AAB found under `android/app/build/outputs/**`, or the iOS IPA at `ios/build/App.ipa`, and fails the hook if an expected archive is missing or ambiguous. It uses the bundled Sentry CLI for both platforms because the installed Android Gradle plugin is below Sentry Size Analysis's Gradle integration requirement.

Configure these values as sensitive EAS environment variables outside the repository:

- `SENTRY_AUTH_TOKEN` for source maps, debug symbols, and Size Analysis uploads.
- `SENTRY_DSN` for Sentry's EAS lifecycle build events.

Never add either value to `app.json`, `eas.json`, or an `EXPO_PUBLIC_*` variable.

After a successful preview and production build for each platform, open Sentry Size Analysis and confirm the AAB/IPA appears. Then review Android and iOS Size Analysis Insights for actionable dependency, asset, or binary-size findings.

## Verification before release

1. Run the repository validation command (`pnpm check`).
2. Produce a native development build and verify cold and warm deep links with IDs/query strings create sanitized breadcrumbs, imperative navigations create templated transactions and router breadcrumbs, representative taps create interaction transactions, and sampled app-start/navigation transactions attach profiles.
3. Produce preview and production EAS builds for Android and iOS with `SENTRY_AUTH_TOKEN` and `SENTRY_DSN` available to the build environment. Confirm source maps/symbols, Size Analysis uploads, and Android/iOS Insights.
4. Temporarily trigger a controlled `Sentry.captureException(new Error('Sentry verification error'))` from a development-only action.
5. Confirm the event is symbolicated in Sentry and contains the expected release/build information.
6. Confirm any error replay remains masked.
7. Remove the temporary verification action before shipping.

## EAS Update

KerjaLog does not currently depend on `expo-updates`, so no EAS Update source-map upload workflow is configured. If OTA updates are added later, export/update source maps must also be uploaded to Sentry according to the current Sentry Expo Update guidance.
