# KerjaLog Product Direction and Technical Architecture

> Status: product and architecture direction for v1
>
> Last reviewed: 2026-08-13

KerjaLog is a private, local-first career achievement tracker for office workers. It helps people capture everyday work while it is still fresh, understand the impact of that work, preserve evidence, and turn that evidence into useful material for performance reviews, one-on-ones, resumes, and interviews.

This document is the source of truth for the initial product scope and technical direction. When implementation choices conflict with this document, prefer the simplest option that preserves the v1 principles below, or update this document deliberately before expanding scope.

---

## 1. Product direction

### 1.1 Primary user

The first-release user is a typical early-career office worker, roughly at the staff or junior individual-contributor level.

Examples include:

- administration and operations staff;
- customer-service staff;
- finance and accounting staff;
- sales and marketing staff;
- HR staff;
- junior analysts;
- junior software or technology staff.

The user is more likely to receive tasks than define department strategy. Their work is often spread across chat, email, spreadsheets, meetings, tickets, and verbal requests. They may have an annual or semiannual performance review, but they usually do not maintain a reliable record of what they contributed throughout the year.

### 1.2 Core problems

KerjaLog should solve five related problems:

1. **Memory loss** — users forget contributions by the time a review, resume update, or interview happens.
2. **Recognition gap** — junior employees often think routine work is too ordinary to count as an achievement.
3. **Impact-language gap** — users describe tasks rather than the value or outcome of their work.
4. **Evidence gap** — users fail to preserve useful metrics, feedback, deadlines, and supporting context.
5. **Review anxiety** — users have to reconstruct months of work under time pressure.

### 1.3 Product promise

> KerjaLog helps office workers privately record everyday contributions, understand the value of their work, and turn real evidence into material for reviews, resumes, and interviews.

A shorter product idea is:

> **Catat kerja. Lihat perkembangan. Siap saat dinilai.**

### 1.4 Core mental model

KerjaLog should help an entry evolve through this sequence:

```text
Task
  -> Contribution
  -> Outcome
  -> Evidence
  -> Career story
```

Example:

```text
Task
Updated customer records.

Contribution
Reviewed and corrected incomplete customer records.

Outcome
Helped the operations team complete monthly verification on schedule.

Evidence
63 records reviewed; 11 incomplete records corrected.

Career story
Demonstrated attention to detail, operational ownership, and coordination.
```

The product should help the user discover this progression without exaggerating or inventing facts.

---

## 2. Product principles

### 2.1 Beginner-first

Do not assume users understand STAR, competencies, KPIs, quantified impact, or professional resume language.

Use approachable questions such as:

- What happened at work?
- What changed because of this?
- Who did this help?
- Do you have a useful number or detail?

### 2.2 Small work counts

KerjaLog must not imply that only large launches, promotions, or revenue wins are worth recording.

Useful entries include:

- completing something important;
- solving or preventing a problem;
- helping a colleague or customer;
- receiving feedback;
- learning something relevant;
- taking ownership;
- navigating a challenge.

### 2.3 Fast capture first, detail later

A basic entry should be recordable in roughly 30 seconds. Users must be able to save a quick note and develop it later.

### 2.4 Private by default

KerjaLog belongs to the employee, not the employer.

There is no manager dashboard, employer visibility, public profile, or automatic workplace sharing in v1.

### 2.5 Evidence over gamification

Do not turn career growth into a score, leaderboard, streak, or competitive metric.

The Growth area should show recorded evidence, not claim to measure the user's actual performance or professional worth.

### 2.6 Never invent impact

KerjaLog may improve wording and structure. It must not invent numbers, responsibilities, people helped, business outcomes, or feedback.

If an outcome is unknown, the UI must allow **I am not sure yet**.

### 2.7 Local-first reliability

The app must remain fully useful without:

- internet access;
- an account;
- a backend;
- a cloud service;
- an AI provider.

The phone is the source of truth for v1.

---

## 3. v1 product scope

### 3.1 Primary navigation

The main application should revolve around four destinations plus a global capture action:

```text
Home     History     +     Growth     Review
```

- **Home** — current week, recent progress, reflection prompt, quick capture.
- **History** — searchable and filterable timeline of work entries.
- **Growth** — evidence map showing skills supported by recorded entries.
- **Review** — generates structured material from selected entries.
- **+** — starts Quick Capture from anywhere appropriate.

### 3.2 Entry types

Use **work entry** as the generic concept. Do not call every entry an achievement.

Initial types:

```ts
type EntryType =
  | 'contribution'
  | 'problem_solved'
  | 'feedback'
  | 'learning'
  | 'ownership'
  | 'challenge';
```

Suggested UI labels:

- I completed something
- I solved a problem
- I helped someone
- I received feedback
- I learned something
- I took responsibility
- Something became difficult

`challenge` entries are private by default and excluded from generated review documents unless the user deliberately includes them.

### 3.3 Entry maturity

Entries can mature over time:

```ts
type EntryStatus = 'quick_note' | 'developed' | 'review_ready';
```

- **quick_note** — captured but not fully developed.
- **developed** — contribution and outcome are understood.
- **review_ready** — sufficiently detailed to use in an export or review draft.

This is an entry-completeness state, not a performance score.

### 3.4 Impact Builder

The Impact Builder is the signature interaction.

A suggested flow:

1. **What happened at work?**
2. **What changed because of this?**
3. **Do you have evidence or a useful detail?**
4. **Preview the impact statement.**
5. **Confirm or edit before saving.**

Outcome choices should include:

- a deadline was met;
- an error was fixed or prevented;
- work became faster;
- work became clearer;
- a customer or colleague was helped;
- a risk was reduced;
- a decision became possible;
- I gained a new skill;
- I am not sure yet.

For v1, the Impact Builder must be deterministic and rules/template based. It must not require a remote LLM.

Persist whether a non-empty impact statement is `generated` or `user` authored. Generated statements may be invalidated and rebuilt when the recorded facts change. User-authored impact wording must never be silently overwritten by generated copy. A null impact statement must have null provenance.

### 3.5 Evidence

Evidence is optional and may include:

- a number;
- a percentage;
- a duration;
- a deadline;
- a result;
- feedback text;
- people or teams helped;
- a short supporting note;
- a non-sensitive reference link.

Do not support work-document or screenshot attachments in v1.

### 3.6 Weekly reflection

Weekly reflection is a retention mechanism and a way to recover work that was not logged during the week.

Suggested prompts:

1. What did you finish or move forward?
2. Who did you help?
3. What problem did you handle?
4. What did you learn?

Every prompt must be skippable.

Use local scheduled notifications. Do not require a notification backend.

The reminder is opt-in. The user chooses the weekday and local wall-clock time before enabling it. Friday at 16:30 is only the initial suggestion, not fixed product behavior. Persist the schedule as local weekday/hour/minute fields rather than a UTC timestamp or serialized calendar date.

On Android 12+, precise user-selected reminder times may use the `SCHEDULE_EXACT_ALARM` special app access. Treat that access as an optional precision upgrade rather than a prerequisite for reminders: Expo SDK 57 falls back to an inexact `setAndAllowWhileIdle` alarm when exact access is unavailable. Keep the reminder enabled in that case, clearly tell the user that delivery is approximate, and offer **Alarms & reminders** settings only if they want exact timing. Persist the last observed reminder precision and reconcile it when the app starts or returns to the foreground so permission grants/revocations re-arm the native reminder in the correct mode. If notification permission or the native scheduled request itself is removed, reconcile the persisted ON/OFF state. Do not turn the reminder off merely because the current runtime cannot inspect native reminder state.

Do not use visible streaks or guilt-based messaging for missed weeks.

### 3.7 Growth / evidence map

Start with broad skill groups:

- communication;
- collaboration;
- problem-solving;
- execution;
- attention to detail;
- customer orientation;
- ownership;
- adaptability;
- leadership;
- technical or role-specific expertise.

The screen should communicate:

```text
Attention to detail
7 supporting entries

Problem-solving
3 supporting entries

Leadership
No evidence recorded yet
```

This means only that KerjaLog has or has not recorded supporting evidence. It must not be described as a rating.

### 3.8 Review Builder

Initial purposes:

- performance self-review;
- one-on-one meeting;
- resume achievement bullets;
- interview examples.

The user selects a time period and entries. KerjaLog may recommend strong entries based on completeness and evidence, but the user remains in control of inclusion.

Suggested performance-review sections:

- major contributions;
- problems solved;
- collaboration and support;
- growth and learning;
- areas to develop;
- next-period goals.

Suggested interview structure:

- Situation
- Task
- Action
- Result
- Learning

### 3.9 Export

v1 should support:

- copy as plain text;
- Markdown export;
- PDF export;
- native share sheet;
- structured JSON export/import for user-controlled data portability.

Because exported files may contain sensitive workplace information, show a confidentiality warning before file export/share.

Do not add a large KerjaLog watermark to user documents.

### 3.10 Language

The product direction is Indonesian-first-friendly while remaining usable in English.

Build UI copy through an i18n layer from the beginning. v1 should support Indonesian and English without embedding user-facing strings throughout feature code.

---

## 4. v1: do this

The following is intentionally prescriptive.

### Product

- **DO** optimize for early-career office workers.
- **DO** make Quick Capture useful in about 30 seconds.
- **DO** allow incomplete notes and later refinement.
- **DO** implement a deterministic Impact Builder.
- **DO** support projects/work areas and broad competencies/skills.
- **DO** implement History with search and practical filters.
- **DO** implement weekly reflection using local notifications.
- **DO** implement the evidence map without performance scoring.
- **DO** implement Review Builder for reviews, one-on-ones, resumes, and interviews.
- **DO** support text, Markdown, PDF, share, and explicit data export/import.
- **DO** support Indonesian and English through an i18n layer.
- **DO** warn users not to store passwords, account numbers, customer PII, confidential documents, or company secrets.

### Privacy and security

- **DO** keep work entries local by default.
- **DO** keep unsaved free-form Log drafts recoverable across process death by storing the single active draft inside encrypted SQLite; never put draft text in AsyncStorage.
- **DO** exclude the encrypted SQLite directory from automatic platform backup where supported, while treating OS backup-exclusion metadata as best-effort and SQLCipher as the confidentiality boundary.
- **DO** encrypt the SQLite database with SQLCipher on Android and iOS.
- **DO** generate the database key locally and store only the key in SecureStore.
- **DO** offer an app lock using device biometrics/passcode-capable platform authentication.
- **DO** treat exports as potentially sensitive data.
- **DO** scrub user-generated career content from crash-report payloads.
- **DO** use prepared/bound SQL parameters for user data.

### Architecture

- **DO** keep SQLite as the persisted source of truth.
- **DO** use feature-first modules.
- **DO** keep domain models independent of React Native and Expo where practical.
- **DO** access persisted data through repositories rather than directly from screens.
- **DO** keep platform concerns such as biometrics, notifications, sharing, and secure storage behind small adapters.
- **DO** use transactions for multi-table writes.
- **DO** ship forward-only database migrations and test them.
- **DO** use SQLite FTS5 for full-text History search when the search implementation is introduced.
- **DO** keep design tokens aligned with Figma semantics: brand, surface, background, text, border, action, success, warning, danger.

### Engineering workflow

- **DO** use strict TypeScript.
- **DO** use pnpm consistently.
- **DO** run type checking, lint/format checks, unit tests, and `expo-doctor` in CI.
- **DO** test Impact Builder rules and Review Builder formatting heavily as pure logic.
- **DO** cover core user journeys with Maestro before store release.
- **DO** use development builds early; SQLCipher and realistic biometric testing should not depend on Expo Go.

---

## 5. v1: do NOT do this

### Product scope

- **DO NOT** add user accounts.
- **DO NOT** add cloud synchronization.
- **DO NOT** add automatic cloud backup.
- **DO NOT** add AI chat or remote LLM generation.
- **DO NOT** add GitHub activity import.
- **DO NOT** add Slack, Teams, Gmail, or calendar ingestion.
- **DO NOT** add screenshot/document attachments.
- **DO NOT** add OCR.
- **DO NOT** add manager collaboration.
- **DO NOT** add employer dashboards.
- **DO NOT** add public profiles or social features.
- **DO NOT** turn KerjaLog into a task manager.
- **DO NOT** turn KerjaLog into a time tracker or attendance system.
- **DO NOT** build a complete resume editor.
- **DO NOT** add salary negotiation coaching.
- **DO NOT** add streaks, leaderboards, levels, or performance scores.
- **DO NOT** make web a first-class v1 product target. The v1 supported products are Android and iOS from one codebase.

### Architecture and infrastructure

- **DO NOT** introduce a backend only to store v1 entries.
- **DO NOT** make network availability part of the core save/read path.
- **DO NOT** introduce TanStack Query before there is meaningful remote server state.
- **DO NOT** introduce Redux for persisted work-entry state.
- **DO NOT** duplicate the SQLite dataset into Zustand.
- **DO NOT** add GraphQL.
- **DO NOT** add microservices.
- **DO NOT** add a monorepo unless a second independently deployable package/app genuinely requires it.
- **DO NOT** add PowerSync or another synchronization engine before multi-device sync is an actual product requirement.
- **DO NOT** use Drizzle v1 release-candidate packages for core persistence. Prefer Expo SQLite plus typed repository functions and committed SQL migrations until the dependency is stable enough for this project.
- **DO NOT** bundle LLM/API provider secrets in the mobile app.

### Privacy

- **DO NOT** upload work-entry contents to analytics.
- **DO NOT** send raw notes, impact statements, feedback, project names, evidence text, or review drafts to Sentry.
- **DO NOT** enable unmasked session replay on screens containing career data.
- **DO NOT** collect employer data that the product does not need.

### Monetization

- **DO NOT** make RevenueCat, subscriptions, or paywalls part of the first product-validation milestone.
- **DO NOT** gate the core learning loop before validating that users repeatedly capture work and return for reviews.

Monetization can be introduced after the core retention loop is proven. Paid AI, advanced exports, or convenience features remain reasonable later options.

---

## 6. Current repository baseline

As of 2026-08-07, the repository already uses a strong modern baseline:

```text
Expo SDK 57
React Native 0.86.2
React 19.2.3
TypeScript 6.0.3
Expo Router 57
React Native Reanimated 4.5.1
pnpm 11.20.0
strict TypeScript
Expo Router typed routes
React Compiler enabled
```

Keep this baseline. Do not downgrade to an older Expo SDK to match older planning notes.

Expo SDK 57 maps to React Native 0.86 and targets Android SDK 36, which is appropriate for the project at the time of this document.

---

## 7. Recommended v1 technical stack

### Keep from the repository

| Concern                  | Choice                                   |
| ------------------------ | ---------------------------------------- |
| Cross-platform framework | Expo SDK 57 + React Native 0.86          |
| UI runtime               | React 19.2                               |
| Language                 | TypeScript 6, strict mode                |
| Package manager          | pnpm                                     |
| Navigation               | Expo Router                              |
| Animation                | React Native Reanimated                  |
| Gestures                 | React Native Gesture Handler             |
| Native screen primitives | react-native-screens / safe-area-context |

### Add for v1

| Concern              | Choice                                          | Why                                                   |
| -------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| Local database       | `expo-sqlite`                                   | Durable relational local storage                      |
| Database encryption  | SQLCipher through `expo-sqlite` config          | Career data may be sensitive                          |
| Secret storage       | `expo-secure-store`                             | Store the database encryption key and small secrets   |
| App lock             | `expo-local-authentication`                     | Optional biometric/device authentication              |
| Forms                | `@tanstack/react-form`                       | Efficient form/wizard state                           |
| Validation           | `zod`                                           | Typed boundary validation                             |
| Ephemeral app state  | `zustand`                                       | Small UI/workflow state only                          |
| Localization         | `expo-localization` + `i18next`/`react-i18next` | Indonesian + English without scattered strings        |
| Reminders            | `expo-notifications`                            | Local weekly reflection reminders                     |
| PDF                  | `expo-print`                                    | Local HTML-to-PDF generation                          |
| Sharing              | `expo-sharing`                                  | Native share sheet for generated files                |
| File handling        | Expo file-system APIs                           | Export/import files                                   |
| Unit/component tests | Jest + React Native Testing Library             | Logic and component confidence                        |
| E2E                  | Maestro                                         | Core Android/iOS journey validation                   |
| Crash reporting      | Sentry, with aggressive scrubbing               | Production diagnostics without career-content leakage |
| Builds/releases      | EAS Build / Submit / Update                     | Managed native build and release workflow             |

### Linting and formatting

Use one primary formatting/linting toolchain rather than overlapping tools.

The project quality gates are:

```text
Biome
+ TypeScript compiler (`tsc --noEmit`)
+ React Compiler healthcheck
+ render-ref purity guard (`pnpm run react:refs:check`)
+ Expo Doctor
```

Keep Biome as the primary JavaScript/TypeScript linter and formatter. Add narrow supplemental checks for framework-specific invariants when they provide clear value; do not introduce overlapping formatter/lint stacks by default.

---

## 8. Local-first architecture

The v1 architecture should look like this:

```text
┌─────────────────────────────────────────┐
│                KerjaLog                 │
│                                         │
│  Expo Router screens                    │
│            ↓                            │
│  Feature hooks/controllers              │
│            ↓                            │
│  Application functions/use cases        │
│            ↓                            │
│  Repository interfaces                  │
│            ↓                            │
│  Encrypted SQLite                       │
│                                         │
│  Platform adapters                      │
│  - secure storage                       │
│  - biometrics                           │
│  - notifications                        │
│  - file export/import                   │
│  - sharing                              │
└─────────────────────────────────────────┘

No required server in the core path.
```

### 8.1 Source-of-truth rule

```text
SQLite = persisted product data
Zustand = ephemeral UI/workflow state
TanStack Form = active form state
```

Do not mirror all entries/projects/evidence from SQLite into a global store.

### 8.2 Repository boundary

Screens should not contain SQL.

Example:

```ts
export interface WorkEntryRepository {
  findById(id: string): Promise<WorkEntry | null>;
  findRecent(limit: number): Promise<WorkEntry[]>;
  search(query: string): Promise<WorkEntry[]>;
  create(input: CreateWorkEntry): Promise<WorkEntry>;
  update(id: string, input: UpdateWorkEntry): Promise<WorkEntry>;
  delete(id: string): Promise<void>;
}
```

v1 implementation:

```text
SQLiteWorkEntryRepository
```

A future sync implementation can be introduced behind the same domain-facing boundary without forcing screens to care about transport details.

### 8.3 Do not over-abstract

This is a solo application, not an enterprise framework exercise.

Prefer plain functions and small interfaces. Do not create a class or interface for every internal helper.

Use an abstraction when it protects a meaningful boundary such as:

- persistence;
- platform-native behavior;
- remote AI later;
- billing later;
- synchronization later.

---

## 9. Proposed source structure

Use `src/app` for Expo Router routes and keep feature implementation outside the route files.

```text
src/
├── app/
│   ├── _layout.tsx
│   ├── onboarding/
│   ├── entry/
│   ├── impact-builder/
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── index.tsx
│       ├── history.tsx
│       ├── growth.tsx
│       └── review.tsx
│
├── navigation/
│   ├── AppTabs.tsx
│   ├── AppTabButton.tsx
│   ├── RootNavigator.tsx
│   └── tabs.ts
│
├── features/
│   ├── onboarding/
│   ├── work-entry/
│   ├── impact-builder/
│   ├── history/
│   ├── growth/
│   ├── reviews/
│   ├── reminders/
│   └── export/
│
├── domain/
│   ├── entry/
│   ├── evidence/
│   ├── project/
│   ├── skill/
│   └── review/
│
├── data/
│   ├── database.ts
│   ├── migrations/
│   ├── repositories/
│   └── queries/
│
├── platform/
│   ├── biometrics/
│   ├── notifications/
│   ├── secure-storage/
│   ├── filesystem/
│   └── sharing/
│
├── design-system/
│   ├── components/
│   └── tokens/
│
├── i18n/
│   ├── en/
│   └── id/
│
└── shared/
    ├── constants/
    ├── types/
    └── utils/
```

Route files should stay thin: compose a screen, read route params, and delegate feature behavior.

Keep reusable app-shell navigation composition in `src/navigation`; it may depend on Expo Router but should not absorb feature or business logic.

---

## 10. Initial data model

The exact schema may evolve, but the model should begin relational rather than storing the entire app as serialized JSON.

### `projects`

```text
id
name
color
archived_at
created_at
updated_at
```

### `work_entries`

```text
id
type
title
raw_note
impact_statement
impact_statement_source
occurred_at
project_id
outcome_type
status
excluded_from_exports
created_at
updated_at
```

### `evidence`

```text
id
entry_id
type
label
text_value
numeric_value
unit
created_at
```

### `skills`

```text
id
slug
name_key
category
```

Use localization keys for built-in skill names instead of storing one language as canonical display text.

### `entry_skills`

```text
entry_id
skill_id
source
```

`source` distinguishes a user-selected skill from a rules-based suggestion. Only confirmed relationships are persisted; unconfirmed rule suggestions remain derived UI state.

### `review_drafts`

```text
id
purpose
period_start
period_end
content
created_at
updated_at
```

### `review_draft_entries`

```text
review_id
entry_id
sort_order
```

### `settings`

Persist durable application preferences that do not belong in secure storage, for example:

```text
locale
theme
weekly_reflection_enabled
weekly_reflection_day
weekly_reflection_time
review_schedule
```

Small secrets and encryption keys belong in SecureStore, not this table.

---

## 11. Database rules

### 11.1 SQLCipher

Use the `expo-sqlite` config plugin with SQLCipher enabled for Android and iOS.

SQLCipher requires a development/native build and should not be designed around Expo Go.

The database key should be generated on device. Store the key in SecureStore and apply it immediately after opening the database.

### 11.2 Migrations

- Keep migrations in source control.
- Migrations are forward-only for released app versions.
- Never edit a migration that has already shipped.
- Test migration from the oldest still-supported schema to the latest schema.
- Make app startup fail safely and visibly if migration cannot complete.

### 11.3 Queries

- Always bind user input as parameters.
- Use transactions for operations that update multiple tables.
- Keep high-level queries in `data/queries` or repository implementations.
- Add indexes based on actual query paths, especially date, project, status, and foreign keys.

### 11.4 Full-text search

When History search is implemented, use SQLite FTS5 rather than filtering all work entries in JavaScript.

Index user-searchable fields such as:

- title;
- raw note;
- impact statement;
- text evidence.

---

## 12. State management

### Zustand is allowed for

- current onboarding state;
- temporary Impact Builder state;
- History filter UI state;
- app-lock session state;
- transient UI preferences.

### Zustand is not allowed to become

- the main work-entry database;
- a copy of every SQLite row;
- a replacement for repository queries.

Do not add TanStack Query in v1. There is no meaningful remote server state to synchronize yet.

---

## 13. Impact Builder architecture

Keep the wording engine behind a small boundary so a future remote AI implementation is optional.

```ts
export interface ImpactAssistant {
  suggest(input: ImpactInput): Promise<ImpactSuggestion>;
}
```

v1:

```text
RulesImpactAssistant
```

It should use:

- entry type;
- user-authored note;
- selected outcome;
- confirmed evidence;
- confirmed skills;
- deterministic templates/rules.

A future version may add:

```text
RemoteAiImpactAssistant
```

If AI is added, the mobile app should call a controlled server function. Never ship an AI provider secret in the app. Never send the entire local career database to an AI service automatically.

---

## 14. Design-system direction

The desired visual direction is bold, modern, vivid purple, and appropriate for office workers without looking like enterprise HR software.

Support system light/dark mode.

Use semantic tokens instead of scattered colors:

```text
brand.*
background.primary
background.surface
text.primary
text.secondary
border.default
action.primary
status.success
status.warning
status.danger
```

Other rules:

- 44pt/44dp minimum practical interactive targets;
- dynamic text/accessibility scaling where feasible;
- do not communicate status by color alone;
- avoid dense dashboard presentation for users with little data;
- use encouraging empty states with role-relevant examples;
- prefer calm progress indicators over streaks and scores.

Keep Figma variable names and code token names conceptually aligned.

---

## 15. Security and privacy requirements

KerjaLog's data model can contain workplace information. Privacy is therefore part of the product architecture, not a later policy task.

### v1 requirements

- encrypted local database;
- optional biometric/device app lock;
- no advertising SDK;
- no automatic employer access;
- no server-side work-entry storage;
- no background content upload;
- explicit data deletion;
- user-controlled export/import;
- confidentiality warning before sharing/exporting;
- privacy-safe crash reporting.

### User guidance

Show a subtle reminder during capture/settings:

> Do not include passwords, customer personal data, account numbers, confidential documents, or company secrets.

KerjaLog cannot guarantee that a user's employer permits storage of every workplace detail on a personal device. The product should encourage users to record outcomes and evidence without copying confidential source material.

---

## 16. Testing strategy

### Unit tests

Prioritize pure business logic:

- Impact Builder rules;
- entry maturity decisions;
- review-entry recommendation/ranking;
- review formatting;
- date-period logic;
- metrics/evidence formatting;
- localization fallbacks;
- export transformations.

### Repository/integration tests

Test:

- migrations;
- transaction behavior;
- CRUD;
- joins;
- FTS search;
- deletion and referential cleanup.

### Component tests

Use React Native Testing Library for interaction behavior rather than implementation-detail snapshots.

### E2E

At minimum, automate these flows before store release:

1. onboarding;
2. quick capture;
3. Impact Builder;
4. save/edit/delete an entry;
5. search History;
6. weekly-reflection entry creation;
7. build a review;
8. export/share;
9. lock/unlock the application.

Use Maestro for cross-platform E2E unless a concrete limitation is found.

---

## 17. CI/CD direction

Suggested pull-request checks:

```text
Biome lint + format check
TypeScript: tsc --noEmit
React Compiler healthcheck
Render-ref purity guard
SQLite schema verification
Unit/component tests
Expo Doctor
Native configuration / Android compile when native behavior changes
Android + iOS export
```

Native builds are more expensive and do not need to run for every tiny documentation-only change if CI is later split by change scope. Changes affecting native configuration, SQLCipher, permissions, or platform modules should continue to exercise a native build path before merge.

Suggested release path:

```text
Pull request
  -> static checks + tests
  -> merge
  -> preview/development build when needed
  -> selected Maestro flows
  -> production EAS build
  -> App Store / Play Store submission
```

Use EAS Update only when the update is compatible with the installed native runtime. Native dependency/config changes require a new binary.

---

## 18. Observability

Sentry is appropriate for crashes and operational diagnostics, but career content must be treated as sensitive.

Before enabling Sentry, configure scrubbing so the following are not sent:

- `raw_note`;
- `impact_statement`;
- feedback text;
- evidence text;
- project names;
- company names;
- review contents;
- exported document contents.

Avoid unmasked session replay on work-entry and review screens.

Product analytics, if introduced later, should prefer anonymous events such as:

```text
entry_created
entry_developed
weekly_reflection_completed
review_generated
export_started
```

Do not attach the user's actual content to those events.

---

## 19. Evolution after v1

The architecture should leave room for later capabilities without paying their complexity cost now.

### Phase A — v1 local-first core

```text
Encrypted SQLite
Quick Capture
Impact Builder (rules)
History
Growth evidence map
Weekly reflection
Review Builder
Export/import
App lock
Indonesian + English
```

### Phase B — monetization after validation

Evaluate RevenueCat when there is a clear premium boundary and evidence that the core loop retains users.

Potential premium features:

- advanced export formats;
- advanced review templates;
- future AI-assisted rewriting;
- future cloud convenience features.

### Phase C — optional account and cloud

If users demonstrate a real need for multi-device recovery/sync:

- introduce Supabase Auth/Postgres/Edge Functions;
- keep local SQLite as the app-facing source of truth;
- implement sync behind repository/sync boundaries;
- evaluate PowerSync only when synchronization complexity justifies another service.

### Phase D — remote AI

If AI becomes valuable:

```text
KerjaLog app
  -> authenticated server/Edge Function
  -> model provider
```

Server responsibilities should include:

- authentication;
- premium entitlement checks;
- rate limiting;
- prompt/version control;
- provider key protection;
- minimal-data requests.

### Phase E — integrations

Only after core retention is proven should the product evaluate:

- GitHub activity import;
- calendar/email/workplace integrations;
- attachments;
- richer interview coaching.

---

## 20. Key architectural decisions summary

| Decision                    | v1 choice                                                |
| --------------------------- | -------------------------------------------------------- |
| Mobile framework            | Expo SDK 57 / React Native 0.86                          |
| Supported product platforms | Android + iOS                                            |
| Web                         | Not first-class in v1                                    |
| Persistence                 | Local encrypted SQLite                                   |
| Database API                | Expo SQLite + typed repositories + SQL migrations        |
| ORM                         | None initially; avoid Drizzle v1 RC for core persistence |
| Accounts                    | None                                                     |
| Backend                     | None required                                            |
| Sync                        | None                                                     |
| AI                          | Deterministic local rules only                           |
| Global state                | Zustand for ephemeral state only                         |
| Forms                       | TanStack Form + Zod                                    |
| Search                      | SQLite FTS5                                              |
| Reminders                   | Local notifications                                      |
| Export                      | Local text/Markdown/PDF/share/JSON                       |
| App protection              | SQLCipher + SecureStore + optional LocalAuthentication   |
| i18n                        | Indonesian + English                                     |
| E2E                         | Maestro                                                  |
| Remote backend later        | Supabase candidate                                       |
| Sync engine later           | Evaluate only when required                              |
| Billing later               | RevenueCat candidate                                     |

---

## 21. Official technical references

These links are implementation references, not requirements to install every technology immediately.

- Expo SDK reference: <https://docs.expo.dev/versions/latest/>
- Expo Router: <https://docs.expo.dev/router/introduction/>
- Expo SQLite: <https://docs.expo.dev/versions/latest/sdk/sqlite/>
- Expo SecureStore: <https://docs.expo.dev/versions/latest/sdk/securestore/>
- Expo LocalAuthentication: <https://docs.expo.dev/versions/latest/sdk/local-authentication/>
- Expo Notifications: <https://docs.expo.dev/versions/latest/sdk/notifications/>
- Expo Print: <https://docs.expo.dev/versions/latest/sdk/print/>
- Expo Sharing: <https://docs.expo.dev/versions/latest/sdk/sharing/>
- Expo EAS Build: <https://docs.expo.dev/build/introduction/>
- Expo unit testing: <https://docs.expo.dev/develop/unit-testing/>
- Expo + Maestro: <https://docs.expo.dev/eas/workflows/examples/e2e-tests/>
- Drizzle Expo SQLite guide (revisit after v1 RC stabilizes): <https://orm.drizzle.team/docs/get-started/expo-new>

---

## 22. Decision rule for future features

Before adding a new service, dependency, or product area, ask:

1. Does this directly improve capture, reflection, evidence, or review preparation?
2. Is there evidence a v1 user needs it now?
3. Can it work locally instead of introducing a server?
4. Does it expose additional workplace data?
5. Can the capability be isolated behind an adapter rather than changing the core domain?
6. Is the operational cost reasonable for one developer?

If the feature fails these questions, defer it rather than expanding v1.
