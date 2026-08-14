# KerjaLog Release Checklist

Use this checklist before distributing a build outside local development. Product and architecture decisions remain defined in `PRODUCT_AND_ARCHITECTURE.md`; this document tracks release-only validation that cannot be proven by static code checks alone.

## Required automated validation

- [ ] `pnpm check` passes on the release commit.
- [ ] The initial SQLite schema verifier passes.
- [ ] React Compiler healthcheck passes without opt-outs added for application code.
- [ ] Render-phase ref purity checks and their fixtures pass.
- [ ] Android native configuration/Kotlin compilation passes.
- [ ] Android and iOS bundle exports pass.

## Privacy and data protection

- [ ] Verify a fresh install creates only the encrypted SQLCipher database.
- [ ] Verify the database key remains in platform secure storage and is not copied into AsyncStorage, logs, analytics, or exported files.
- [ ] Verify Android application backup remains disabled.
- [ ] Verify the iOS database remains excluded from device/cloud backup.
- [ ] Verify App Lock hides protected content in the app switcher / screen capture path on supported platforms.
- [ ] Verify an entry with `excludedFromExports = true` remains visibly Private even if its entry type is later changed from Challenge.

## Apple encryption export compliance

KerjaLog uses SQLCipher and platform cryptography. Before every TestFlight/App Store submission:

- [ ] Complete or re-check the current App Store Connect encryption/export-compliance questionnaire for the shipped cryptography.
- [ ] Confirm that `expo.ios.config.usesNonExemptEncryption` in `app.json` matches that determination.
- [ ] Do not change the declaration solely to silence App Store Connect prompts; retain the supporting compliance determination with release records.

## Android notifications and exact alarms

KerjaLog's weekly reflection reminder supports exact and inexact delivery.

- [ ] Test on a device where exact-alarm access is granted.
- [ ] Test on a device where exact-alarm access is denied/revoked.
- [ ] Confirm the reminder still schedules through the supported inexact fallback and the UI reports approximate delivery rather than failing the feature.
- [ ] Re-check Play policy requirements before release if the exact-alarm permission or reminder behavior changes.

## Accessibility and responsive UI

Run these checks in both English and Indonesian, light and dark mode:

- [ ] VoiceOver: complete onboarding, capture, refinement, History search/filter, Saved Entry, and App Lock.
- [ ] TalkBack: complete the same flows.
- [ ] Verify selection controls announce radio/checkbox state and wizard progress is understandable without color.
- [ ] Verify visible labels are associated with text inputs and the spoken fallback label remains correct.
- [ ] Test large accessibility text (including the largest practical system setting) without clipped primary actions or inaccessible content.
- [ ] Test a short/small Android viewport with the keyboard open on note, evidence, and impact fields.
- [ ] Test an iPhone SE-class viewport or smallest supported iOS simulator with the keyboard open.

## Workflow integrity

- [ ] Create a quick note, terminate the app mid-capture, relaunch, and verify encrypted draft recovery.
- [ ] Refine a saved entry and verify outcome, evidence, skills, impact, maturity, and History search all reflect the update.
- [ ] Manually edit a generated impact statement, change an earlier fact, and verify user-authored wording is not silently overwritten.
- [ ] Trigger a route-completion/navigation failure after a successful save and verify retry does not write the entry twice.
- [ ] Use Android hardware/predictive Back with dirty capture and refinement forms and verify the discard guard.
- [ ] Background/foreground the app while editing and verify draft/app-lock behavior remains correct.

## Dependency and repository security

- [ ] GitHub dependency graph is enabled.
- [ ] Dependabot alerts are enabled.
- [ ] Dependabot security updates are enabled or there is an equivalent documented dependency-remediation process.
- [ ] Review direct dependencies with no repository references before each release; remove them only after confirming they are not required by Expo config plugins, native generation, or package peer/runtime requirements.
- [ ] Investigate and remediate new dependency advisories before release.

## Pre-release schema note

Until the first distributed build containing valuable user data, local development installs may be recreated when `001-initial.ts` changes. After the first such distribution, shipped migrations become immutable and every schema change must use a new forward-only migration version.
