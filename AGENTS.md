# KerjaLog agent guide

KerjaLog is a private, local-first career-achievement tracker for early-career
office workers. Its promise is: **Catat kerja. Lihat perkembangan. Siap saat
dinilai.** The supported v1 platforms are Android and iOS; web support is
incidental and is not a product, quality, or CI target.

This guide is the operational starting point for work in this repository. Keep
changes small, intentional, and consistent with the product architecture.

## Read first and resolve conflicts deliberately

1. Follow this file and any closer `AGENTS.md` file first.
2. For a product, persistence, privacy, backend, AI, sync, or infrastructure
   decision, read `docs/PRODUCT_AND_ARCHITECTURE.md`. It is authoritative over
   the roadmap when they differ.
3. Before changing runtime UI, read `DESIGN.md`. Also read
   `prototype/index.html` when it exists; it is a visual reference only, never
   runtime HTML/CSS to import or copy into the native app.
4. For releases and native/privacy validation, read `docs/RELEASE_CHECKLIST.md`,
   `.maestro/README.md`, and `docs/SENTRY.md` as applicable.
5. Preserve a dirty worktree and unrelated user changes. Inspect the current
   diff before touching a shared file; do not reset, clean, or overwrite work
   you do not own.

If a requested change would add accounts, a backend for core entry storage,
cloud sync or backup, remote AI/LLMs, workplace integrations, attachments/OCR,
employer or social features, gamification, or web as a first-class target,
stop and obtain an explicit product-direction change. The same applies when a
change would weaken local-first use, confidentiality, or user control.

## Repository exploration and current documentation

`C:\\Users\\fdsur\\.codex\\RTK.md` applies: prefix every shell command with
`rtk` (for example, `rtk git status`, `rtk pnpm test:ci`, or
`rtk codegraph explore "..."`).

This repository has a `.codegraph/` index. Use CodeGraph before `rg`, `grep`,
`find`, or manually reading source when locating or understanding code:

```powershell
rtk codegraph explore "Trace <feature/symbol> and its callers, tests, and data boundary."
```

Use the returned source/call paths as the first source of truth; request a
specific deferred symbol through CodeGraph when more detail is needed. Do not
use Graphify for KerjaLog exploration.

When a task asks about a library, framework, SDK, API, CLI, or cloud-service
behavior, use Context7 before answering or coding, even for familiar tools. Do
not use it for ordinary refactors, business-logic debugging, code review, or
general programming concepts. Resolve the library first, select the exact and
reputable matching result, then fetch one specific concept at a time:

```powershell
rtk npx ctx7@latest library "<official library name>" "<specific concept>"
rtk npx ctx7@latest docs /org/project "<specific concept>"
```

Use the official library name, pass no sensitive data, and make no more than
three Context7 requests for one question. Run Context7 outside the default
sandbox. If it reports DNS/network failure, retry outside the sandbox; if it
reports quota exhaustion, say so and suggest `rtk npx ctx7@latest login` or
`CONTEXT7_API_KEY`. Do not silently substitute stale library knowledge. Before
writing Expo code, read the exact Expo SDK 57 documentation at
<https://docs.expo.dev/versions/v57.0.0/>.

## Product invariants

- Help users progress from **task -> contribution -> outcome -> evidence ->
  career story** without exaggerating or inventing facts.
- Keep Quick Capture useful in roughly 30 seconds. Incomplete quick notes must
  remain savable and refinable later.
- The v1 Impact Builder is deterministic and local. It may improve wording,
  but must never fabricate numbers, responsibilities, people helped, outcomes,
  or feedback. Keep user-authored impact statements intact; invalidate and
  regenerate only generated statements when their source facts change.
- Growth is evidence coverage, not a rating, score, or measure of professional
  worth. Avoid streaks, leaderboards, levels, guilt-based prompts, and dense
  dashboards.
- Keep the interface beginner-first, encouraging, and Indonesian-first-friendly
  while fully usable in English. Do not scatter user-facing text through
  feature code.
- Treat work entries, evidence, work areas, review material, and exports as
  potentially sensitive workplace information. Never use real workplace data in
  tests, screenshots, fixtures, telemetry, issue text, or commits.

## Architecture map

```text
src/app/                 Expo Router route files only
src/navigation/          root stack, tabs, notification navigation
src/features/<feature>/  screens, components, hooks/controllers, presentation
src/domain/              framework-independent models, rules, repository types
src/data/                encrypted SQLite setup, migrations, queries, repositories
src/design-system/       native primitives, themes, tokens, icons, layout helpers
src/i18n/                typed English/Indonesian translation catalogues
src/platform/            small native adapters and observability
src/shared/              genuinely cross-cutting UI and utilities
tests/                   Jest + React Native Testing Library coverage
.maestro/                clean-device Android/iOS journey checks
```

Routes delegate to feature screens/controllers; screens must not contain SQL.
Domain code should stay independent of React Native/Expo where practical.
Repositories are the data boundary; use typed repository interfaces and the
corresponding SQLite implementation rather than reaching into the database from
UI code. Keep platform-native work (secure storage, biometric authentication,
screen privacy, notifications, Sentry) behind focused `src/platform/` adapters.
Avoid abstractions that do not protect a real boundary.

The root provider order is intentionally:

```text
SafeAreaProvider -> ThemeProvider -> I18nProvider -> OnboardingProvider
-> AppLockProvider -> RootNavigator
```

Do not bypass root hydration: the navigator waits for icons, theme, language,
onboarding, and app-lock state before hiding the splash screen. Tabs are Home,
History, the global capture action, Growth, and Review; capture routes to
`/entry/new` rather than rendering a normal tab screen.

### State, forms, and asynchronous work

```text
SQLite                 persisted product data
React local/context    component-local and app-shell UI state
TanStack Form          active persisted-form/wizard state
Zustand                only genuinely shared, ephemeral cross-feature state
```

Do not mirror the SQLite data set into Zustand, introduce Redux, or add
TanStack Query while there is no meaningful remote server state. Use
`@tanstack/react-form` as the canonical owner for a persisted validated form;
do not introduce duplicate local field state. Input updates are synchronous,
and keyboard/IME submission and button presses share one submit handler.

For Work Areas, `useWorkAreaManagement` owns catalogue/editor/mutation state,
validation dispatch, archiving, and duplicate-submit protection.
`useWorkAreaNameForm` is the canonical TanStack Form boundary for names, and
`components/workAreaNameError.ts` centralizes validation-versus-mutation error
precedence. Keep that separation instead of reintroducing mirrored name state.

Refs need an explicit, narrow reason: same-tick reentrancy protection,
request IDs that reject stale async results, or imperative UI control such as
onboarding scrolling. Prefer state/callbacks otherwise, and preserve the
documented reason when modifying a ref.

## Persistence and privacy are non-negotiable

- Persist product data in the encrypted SQLCipher SQLite database only. The
  database key is device-generated and lives only in SecureStore.
- Keep unsaved free-form Log draft text in the single encrypted SQLite draft,
  never in AsyncStorage. AsyncStorage is suitable only for small non-sensitive
  preferences such as theme/language/onboarding choices.
- `src/data/database.ts` keys a dedicated connection before accessing data.
  Preserve its missing-key and key-persistence failure behavior. Do not change
  the database name/keying flow casually.
- Route all access to the keyed connection through
  `withKeyedDatabaseAccess`; use `withKeyedTransaction` for multi-table writes.
  Do not switch to Expo SDK 57's exclusive transaction API: its second native
  connection is unkeyed and cannot read SQLCipher data.
- Bind every user-supplied SQL value. Keep high-level queries in repositories or
  `src/data/queries`, and use transactions for multi-table operations.
- Migrations live in `src/data/migrations`. A migration that has shipped is
  immutable and every future change is forward-only, versioned, and tested from
  the oldest supported schema. Let startup fail visibly and safely if migration
  cannot complete.
- Maintain local-only, offline core read/save behavior. There is no account,
  backend, automatic cloud backup, analytics upload of user content, or required
  network path in v1.
- App Lock is privacy-sensitive: retain fail-closed behavior when its setting,
  privacy protection, or authentication cannot be safely established. Do not
  weaken app-switcher/screenshot protection.
- Sentry must redact user content, sensitive fields, route IDs, URLs, request
  data, and console breadcrumbs. Extend the existing redaction layer before
  adding telemetry; never put DSNs, auth tokens, or user data in `app.json`,
  `eas.json`, `EXPO_PUBLIC_*`, logs, or commits.
- Exports/sharing require a confidentiality warning. Never add document or
  screenshot attachments in v1.

## UI, accessibility, and localization

`DESIGN.md` governs runtime UI. Native source of truth is
`src/design-system/tokens/theme.ts`; reuse `Text`, `TextField`, `Button`,
theme hooks, icon primitives, and feature anatomy before creating a component.
There is no global CSS or HTML-head stylesheet. Use `StyleSheet` and tokens;
do not hard-code runtime colors, arbitrary font sizes, or a parallel visual
system. If a pre-existing component conflicts with `DESIGN.md`, explain the
conflict and choose the option that makes the overall interface most consistent.

- Support light/dark themes, narrow phones (including 320dp), large Dynamic
  Type, and long English/Indonesian copy. Let record-identifying text wrap;
  action rows must wrap before controls clip.
- Use token spacing/radii/layout values and the existing `Text` variants.
  Standard card, screen-padding, and semantic-color rules are defined in
  `DESIGN.md`.
- Buttons are at least 48dp high. Use primary for a form commit, secondary for
  non-destructive alternatives, ghost for low emphasis, and `destructive` only
  in a confirmed destructive path. Do not use danger/success/warning merely as
  decoration.
- Expose visible labels plus native accessibility semantics. Headings are
  headers; busy/disabled controls expose their state; progress is programmatic;
  validation and recoverable mutation errors use a polite `role="alert"`.
  Never communicate state by color alone or disable font scaling.
- Add every new user-facing key to the typed `src/i18n/catalog.ts` composition
  and supply both `en` and `id` values in the appropriate feature translation
  files. Render strings through `useI18n().t`, including accessibility labels
  and status/error copy.

For broad UI/refactor work, audit surrounding hierarchy, colors, states,
responsiveness, and accessibility rather than changing only the named control.
Use staged phases and a self-review/verification pass after each meaningful
phase when the request calls for a broad refactor.

## Native configuration and dependencies

The repository uses Node 24 (`>=24 <25`) and pnpm 11.20.0. Keep the lockfile
and `pnpm-workspace.yaml` in sync with `package.json`. The workspace override
for `expo-constants` must remain aligned with the installed Expo SDK 57 patch.
Run package updates and `expo-doctor` serially—never concurrently—so a stale
process cannot restore an incompatible override.

Use a development build, not Expo Go, for SQLCipher, biometric auth,
notifications, screen privacy, and other native behavior. JavaScript/TypeScript
changes normally only need Metro; rebuild a dev client after native dependency,
config-plugin, `app.json`, or native-module changes:

```powershell
rtk pnpm android
rtk pnpm ios
rtk pnpm start
```

Treat `app.json` and files in `plugins/` as native-config sources. When they or
related dependencies change, verify generated Android/iOS configuration with
`native:check`; do not hand-edit generated native output as a substitute. Keep
SQLCipher enabled, automatic backup disabled/excluded as configured, biometric
permissions intact, and Android exact-alarm permission blocked. The weekly
reminder is an opt-in ordinary local notification; do not require exact-alarm
special access or represent its timing as exact.

## Verification expectations

Start with the smallest relevant test, then run stronger checks proportional to
the blast radius. Commands below are repository-native checks; all use `rtk`:

```powershell
rtk pnpm format:check
rtk pnpm lint
rtk pnpm typecheck
rtk pnpm run compiler:check
rtk pnpm run schema:check
rtk pnpm test:ci
rtk pnpm run expo:doctor
rtk pnpm run native:check
rtk pnpm run export:android
rtk pnpm run export:ios
rtk pnpm check
rtk git diff --check
```

`pnpm check` is the complete CI-equivalent validation sequence. Prefer a
focused Jest file while iterating, then run the relevant integration checks;
use `test:ci` when validating a complete change because it is deterministic
(`--maxWorkers=1`). Do not run the writing formatter (`pnpm format`) unless a
deliberate repository-wide formatting change is in scope.

Changes to schema, SQLCipher keying, secure storage, migrations, native config,
notifications, app lock, screen privacy, Sentry, exports, or dependencies need
their dedicated tests plus the relevant native/config checks. UI changes need
component coverage and manual Android/iOS inspection in both themes, at narrow
width and large text. Do not claim a device capture was performed when no
device/emulator was connected; automated coverage is valuable but is not a
physical capture.

Before a store release, run the Maestro journeys on clean English-language
development builds:

```powershell
rtk maestro test .maestro/log-entry.yaml
rtk maestro test .maestro/refine-entry.yaml
rtk maestro test .maestro/draft-recovery.yaml
```

Also complete the manual assisted security scenario in `.maestro/README.md`
for app lock, screenshot/app-switcher protection, and encrypted draft recovery.
Never capture or commit screenshots containing workplace information.

## Delivering a change

Before implementation, state the user-visible outcome and constraints; use
CodeGraph to identify affected symbols and tests. During implementation, keep
feature, domain, data, and platform boundaries intact and update tests/i18n/
accessibility with the behavior they cover. Afterward, inspect the diff for
scope creep, token/accessibility regressions, translation gaps, privacy leaks,
migration integrity, and generated-output changes; run the appropriate checks
and report exactly what was and was not verified.

Do not commit, push, deploy, alter remote services, or expose credentials unless
the user explicitly asks. Generated `dist/` export output and local native build
artifacts are verification by-products, not a reason to widen a source change.
