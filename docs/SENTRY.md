# Sentry operations

KerjaLog uses `@sentry/react-native` with Expo, Expo Router, and Continuous Native Generation.

## Runtime privacy defaults

The runtime configuration is intentionally conservative because KerjaLog stores private career notes:

- default PII collection is disabled;
- Expo Router reports templated route names without concrete route parameters; current `wrapExpoRouter` instrumentation also suppresses concrete pathnames, hrefs, and params when `sendDefaultPii` is disabled;
- Session Replay uploads only when an error occurs;
- replay text, images, and vectors remain masked;
- automatic JavaScript console breadcrumbs are disabled so arbitrary console output cannot capture private career text; XHR breadcrumbs remain enabled and their URLs and sensitive fields are scrubbed;
- JavaScript error and transaction events retain safe diagnostic metadata, opaque user IDs, request methods, and sanitized request paths; headers, cookies, bodies, query strings, and sensitive keys in `contexts`, `extra`, and `tags` are removed or filtered;
- unexpected onboarding and work-entry persistence failures include only fixed-value `feature`, `operation`, and `failure.kind` tags plus a `workflow` context (`screen`, `step`, `mode`, and failure state); expected form validation is not reported;
- workflow breadcrumbs record only fixed state transitions; no work-entry text, IDs, or user values are included;
- JavaScript exception values scrub work-entry identifiers, and persistence errors use stable messages so a private local ID cannot fragment issue grouping;
- deep-link breadcrumbs remove query strings/fragments and normalize known `/entry/<id>` routes to `/entry/[id]`; Sentry's own deep-link integration also sanitizes identifier-like segments when `sendDefaultPii` is disabled;
- trace-propagation headers are disabled until a first-party backend origin is explicitly allowlisted;
- screenshots, view hierarchy attachments, request/response bodies, and request headers are not enabled.

Do not add work-entry text, evidence, feedback, user-entered values, authentication material, or database contents to Sentry messages, tags, breadcrumbs, logs, or custom contexts. The client-side scrubbers are defense in depth, not permission to send sensitive values. If identifying a signed-in user, use only an opaque, non-reversible ID; never send names, emails, usernames, or IP addresses.

KerjaLog currently uses React Native's standard XHR-backed `fetch`, so only XHR breadcrumbs are enabled to prevent duplicate network trails. If the app adopts `expo/fetch`, revisit this setting and enable `fetch` as well.

`beforeSend` and `beforeSendTransaction` apply only to JavaScript events. Keep Sentry's server-side data-scrubbing rules enabled as a second layer, covering credentials, personal data, and any future network query parameters. Native crash payloads are not filtered by these JavaScript hooks.

## Environments

Sentry events are explicitly labeled as `development`, `preview`, or `production`. Each EAS build profile selects the matching EAS `environment` and sets the non-secret `EXPO_PUBLIC_SENTRY_ENVIRONMENT` label in `eas.json`; local development falls back to `development`, and a non-development build without an explicit value falls back to `production`.

Do not reuse `EXPO_PUBLIC_SENTRY_ENVIRONMENT` for secrets. `EXPO_PUBLIC_*` values are embedded in the client bundle by design.

## Source maps and debug symbols

The Expo config plugin in `app.json` and the Sentry Metro configuration in `metro.config.js` enable automatic source-map/debug-symbol handling for native release builds.

Source-map uploads require a Sentry organization auth token named `SENTRY_AUTH_TOKEN` in the build environment.

- For EAS Build, store `SENTRY_AUTH_TOKEN` as a sensitive/secret EAS environment variable. Never place the token in `app.json`, `eas.json`, or an `EXPO_PUBLIC_*` variable.
- For local release builds, put the token in a gitignored local environment file such as `.env.local` or `.env.sentry-build-plugin`, or export it only for the build process.
- The Sentry DSN in application code is a public ingestion identifier, not the source-map upload credential.

The `@sentry/react-native/expo` plugin configuration in `app.json` is the single source of truth for the Sentry organization and project. If either slug changes, update that plugin configuration before the next release build.

pnpm lifecycle scripts remain deny-by-default. `pnpm-workspace.yaml` uses pnpm 11's `allowBuilds` map to explicitly allow only `@sentry/cli` to run dependency build scripts because the CLI needs to provision its platform binary for Sentry build tooling. Do not replace this narrow allowlist with a global build-script bypass.

## Expo Router tracing

`expoRouterIntegration` is configured in the root layout. It records navigation transactions without manual React Navigation container registration. Native frame tracking and Time to Initial Display are disabled in Expo Go because those measurements require a native build.

Every imperative `useRouter()` call is wrapped with `Sentry.wrapExpoRouter`: tabs, onboarding, home, history, log flow, log, saved entry, edit entry, and refinement editor. In `@sentry/react-native` 8.23 this is the supported instrumentation path for `prefetch`, `push`, `replace`, `navigate`, `back`, and `dismiss`; it adds navigation breadcrumbs/spans while gating concrete paths and params behind `sendDefaultPii`.

Component render spans use `Sentry.withProfiler` only around the root layout and route-level onboarding, home, history, log, saved-entry, and edit-entry screens. Leaf and workflow components remain unwrapped to keep performance data actionable.

The Metro transform is also configured to wrap Expo Router `ErrorBoundary` re-exports. KerjaLog's custom root route error boundary is wrapped explicitly so handled render errors are still reported to Sentry while keeping the existing fallback UI.

KerjaLog supports iOS and Android only. Metro excludes Sentry's web Feedback and Replay code; mobile error replay remains enabled with masking.

## Sampling

Development tracing is sampled at 100% to make instrumentation easier to verify. Non-development builds sample 10% of performance traces.

Native development builds profile 100% of sampled transactions. Non-development profiles sample 10% of the already sampled traces, so the effective profile rate is 1% of all transactions (`0.1 × 0.1`). Profiling is omitted in Expo Go because Hermes/native profiling requires a development or release build. Sentry's automatic native profiling integration is used; experimental continuous UI profiling is not enabled.

Normal sessions are not uploaded as Session Replays. When an error occurs, Sentry may upload the buffered error replay with masking enabled.

Review sampling after real production traffic is available. Raise or lower trace sampling based on debugging value, event volume, app overhead, and Sentry quota rather than treating the initial value as permanent.

## EAS Size Analysis and Insights

`eas-build-on-success` first runs `scripts/upload-sentry-size-analysis.cjs`, then sends Sentry's successful-build event. `eas-build-on-error` remains responsible for failed-build events; there is no `eas-build-on-complete` hook, preventing duplicate failed-build events.

The upload hook runs only for successful `preview` and `production` EAS builds. It reads the organization and project from the Expo plugin configuration and uploads exactly one Android AAB found under `android/app/build/outputs/**`, or the iOS IPA at `ios/build/App.ipa`. It uses the bundled Sentry CLI for both platforms because the installed Android Gradle plugin is below Sentry Size Analysis's Gradle integration requirement.

Size Analysis is best-effort observability: a missing archive, missing Size Analysis credential, or Sentry CLI upload failure is logged as a warning and does not convert an otherwise successful application build into a failed EAS build. Source-map/debug-symbol handling remains part of the native Sentry build integration and should still be verified before release.

Configure these values as sensitive EAS environment variables outside the repository:

- `SENTRY_AUTH_TOKEN` for source maps, debug symbols, and Size Analysis uploads.
- `SENTRY_DSN` for Sentry's EAS lifecycle build events.

Never add either value to `app.json`, `eas.json`, or an `EXPO_PUBLIC_*` variable.

After a successful preview and production build for each platform, open Sentry Size Analysis and confirm the AAB/IPA appears. If the upload hook emitted a warning, investigate it without blocking delivery of an otherwise valid build unless the release policy explicitly requires Size Analysis.

## Verification before release

1. Run the repository validation command (`pnpm check`).
2. Confirm dependency installation does not report ignored `@sentry/cli` build scripts.
3. Produce a native development build and verify cold and warm deep links with opaque IDs/query strings create sanitized breadcrumbs, imperative navigations create privacy-safe navigation spans/breadcrumbs, representative taps create interaction transactions, and sampled app-start/navigation transactions attach profiles.
4. Produce preview and production EAS builds for Android and iOS with `SENTRY_AUTH_TOKEN` and `SENTRY_DSN` available to the build environment. Confirm the resulting Sentry events use the expected `preview` or `production` environment and that source maps/symbols are uploaded.
5. Confirm Size Analysis uploads when available; treat a Size Analysis warning as an observability follow-up rather than an application-build failure.
6. Temporarily trigger a controlled `Sentry.captureException(new Error('Sentry verification error'))` from a development-only action.
7. Confirm the event is symbolicated in Sentry and contains the expected release/build information.
8. Confirm any error replay remains masked.
9. Remove the temporary verification action before shipping.

## EAS Update

KerjaLog does not currently depend on `expo-updates`, so no EAS Update source-map upload workflow is configured. If OTA updates are added later, export/update source maps must also be uploaded to Sentry according to the current Sentry Expo Update guidance.
