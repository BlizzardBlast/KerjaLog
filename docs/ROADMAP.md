# KerjaLog v1 delivery roadmap

> Status: implementation sequencing for v1
>
> Last reviewed: 2026-08-30

This roadmap tracks delivery order and implementation status. It does **not** replace [`PRODUCT_AND_ARCHITECTURE.md`](./PRODUCT_AND_ARCHITECTURE.md), which remains the source of truth for product scope, privacy principles, architecture, and v1 `DO` / `DO NOT` decisions.

## Product loop

KerjaLog v1 is being built around this loop:

```text
Capture work
  -> develop the facts
  -> connect confirmed skill evidence
  -> see accumulated Growth evidence
  -> reflect on missed work
  -> prepare Review material
  -> export only what the user chooses
```

The sequencing intentionally proves the local-first evidence loop before accounts, cloud sync, remote AI, workplace integrations, attachments, or monetization.

## Milestone status

### Completed foundation

- [x] Expo / React Native Android and iOS foundation
- [x] persisted onboarding, English / Indonesian i18n, theme support, and app navigation
- [x] encrypted SQLCipher work-entry persistence with the key stored through SecureStore
- [x] App Lock and screen-privacy protection
- [x] configurable local weekly-reminder scheduling
- [x] Sentry observability with privacy-preserving defaults

### Completed evidence capture

- [x] Quick Save for fast work capture
- [x] full deterministic Impact Builder flow
- [x] encrypted in-progress draft recovery
- [x] saved-entry refinement
- [x] optional evidence capture
- [x] deterministic skill suggestions with explicit user confirmation
- [x] persisted confirmed `entry_skills` relationships
- [x] History timeline with search, practical filters, and cursor pagination

### Completed — Growth / Evidence Map

- [x] evidence map across all canonical skills
- [x] supporting-entry counts without ratings, percentages, levels, or performance scores
- [x] zero-evidence skills shown without negative or deficit language
- [x] skill drill-down showing the real saved entries behind the evidence
- [x] focus-driven refresh from encrypted SQLite
- [x] read-only Growth surface; skill editing remains in capture / refinement
- [x] English and Indonesian copy
- [x] loading, error, refresh-error, empty, accessibility, and Dynamic Type-aware states

Growth is a projection over the existing encrypted `skills`, `entry_skills`, `work_entries`, and `evidence` data. It does not create a second persisted source of truth and does not change export privacy rules.

### Completed — Weekly Reflection

- [x] four skippable prompts for work moved forward, people helped, problems handled, and learning
- [x] explicit review step before any reflection answer enters the work-entry flow
- [x] user-confirmed answers handed into the existing encrypted active work-entry draft
- [x] existing unfinished work-entry drafts preserved instead of overwritten
- [x] reflection answers kept ephemeral until the user deliberately chooses **Log this**
- [x] existing work-entry validation, Quick Save, refinement, skill confirmation, and deterministic Impact Builder reused after handoff
- [x] Home entry point plus English and Indonesian copy
- [x] no streaks, guilt messaging, remote notification backend, AI generation, or second persisted reflection store

Weekly Reflection is an orchestration layer over the existing local-first work-entry system. Reflection answers do not become work entries automatically, and free-form reflection content is not stored in AsyncStorage or passed through route parameters.

### Completed — Projects / Work Areas

- [x] encrypted local work-area catalog for projects, recurring responsibilities, or areas of work;
- [x] optional work-area association in Quick Save, full capture, encrypted draft recovery, and refinement;
- [x] inline work-area creation without adding another mandatory capture step;
- [x] rename and archive management without task/project-management concepts;
- [x] archived work areas preserved on historical entries while excluded from new-entry choices;
- [x] History filtering by work area, composed with existing search, evidence, entry-type, review-ready, and cursor-pagination behavior;
- [x] Saved Entry metadata without adding organizational labels to the Evidence Thread;
- [x] English and Indonesian copy with work-area names treated as private workplace content.

Projects / Work Areas stays deliberately lightweight. There are no tasks, statuses, assignees, project planning, time tracking, collaboration, or employer visibility. Because KerjaLog has not yet had an external distribution containing valuable user data, this pre-release milestone updates `001-initial` directly rather than creating a second migration. Once the first real distribution ships, released migrations become immutable and future schema evolution is forward-only.

## Next milestones

### Current milestone — Review Builder

Complete the second major value-return loop after Growth.

Initial purposes defined by the product direction:

- performance self-review;
- one-on-one meeting;
- résumé achievement bullets;
- interview examples.

Scope:

- choose a time period and entries;
- deterministic recommendations based on evidence/completeness, never a user-facing performance score;
- keep the user in control of inclusion;
- preserve challenge/export exclusion defaults;
- heavily test formatting and selection policy as pure logic.

### 2. Export and native sharing

Make Review Builder output usable outside KerjaLog.

Scope:

- copy as plain text;
- Markdown export;
- PDF export;
- native share sheet;
- confidentiality warning before file export/share;
- no large KerjaLog watermark.

### 3. User-controlled JSON export / import

Complete local-first data portability before release.

Scope:

- explicit structured export of user-owned KerjaLog data;
- validated import with safe conflict/error handling;
- clear confidentiality warning because exported data may contain workplace information;
- no automatic cloud backup or sync.

### 4. Release hardening and product validation

Before store release:

- complete the native checks in [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md);
- expand Maestro coverage across the completed v1 loop;
- validate VoiceOver / TalkBack and large Dynamic Type on real devices;
- validate encrypted-database lifecycle, App Lock, notification behavior, export privacy, and import recovery;
- use real user feedback to decide what belongs after v1.

## Explicitly deferred until after core v1 validation

Do not pull these forward merely because implementation is technically possible:

- accounts or authentication services;
- cloud synchronization or automatic cloud backup;
- remote LLM / AI chat generation;
- GitHub, Slack, Teams, Gmail, or calendar ingestion;
- screenshot/document attachments or OCR;
- manager dashboards, employer collaboration, or public profiles;
- RevenueCat, subscriptions, or paywalls;
- performance scores, streaks, leaderboards, levels, or rankings.

Any change to these boundaries should first be a deliberate product-direction change in `PRODUCT_AND_ARCHITECTURE.md`, not an incidental roadmap edit.

## Roadmap decision rules

When deciding whether to pull work forward:

1. Prefer features that strengthen **capture -> evidence -> review** for the primary early-career office-worker user.
2. Prefer reuse of encrypted SQLite data and existing domain logic over parallel state models.
3. Keep network availability optional for the core product.
4. Add schema or dependencies only when a concrete feature requires them.
5. Preserve evidence over scoring and never invent impact.
6. Treat privacy, accessibility, native reliability, and data portability as product requirements rather than post-launch cleanup.
