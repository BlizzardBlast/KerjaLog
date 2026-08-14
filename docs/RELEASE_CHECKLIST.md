# KerjaLog Release Checklist

Use this checklist before distributing a build outside local development. Product and architecture decisions remain defined in `PRODUCT_AND_ARCHITECTURE.md`; this document tracks release-only validation that cannot be proven by static code checks alone.

## Required automated validation

- [ ] `pnpm check` passes on the release commit.
- [ ] The initial SQLite schema verifier passes.
- [ ] React Compiler healthcheck passes without opt-outs added for application code.
- [ ] Official React Hooks/compiler-aware ESLint rules pass with zero warnings.
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

KerjaLog embeds SQLCipher, so `expo.ios.config.usesNonExemptEncryption` is intentionally **unset** until the shipped cryptography and distribution countries have been classified through App Store Connect. Do not encode an exemption before that determination.

Before every TestFlight/App Store submission:

- [ ] Complete or re-check the current App Store Connect encryption/export-compliance questionnaire for the exact shipped build and intended countries.
- [ ] Record whether Apple determines that export-compliance documentation is required. If required, upload/obtain the applicable declaration or compliance code before submission.
- [ ] Only after that determination, set `expo.ios.config.usesNonExemptEncryption` (and an export compliance code if Apple provides one) to match the approved classification, or intentionally leave the key unset so App Store Connect continues to ask the questionnaire.
- [ ] Retain the supporting compliance determination with release records; never set the flag merely to suppress App Store Connect prompts.

## Android notifications

KerjaLog's weekly reflection is an ordinary local reminder and does not request exact-alarm special access.

- [ ] Test with notification permission granted and confirm the weekly request is scheduled.
- [ ] Test with notification permission denied/revoked and confirm the app reports the reminder as disabled without crashing.
- [ ] Change the reminder day/time and confirm the native scheduled request is replaced with the new schedule.
- [ ] Remove the native scheduled request and confirm foreground reconciliation updates persisted reminder state.
- [ ] Confirm AndroidManifest does not contain `SCHEDULE_EXACT_ALARM`; delayed delivery from OS power management is acceptable for this feature.

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
