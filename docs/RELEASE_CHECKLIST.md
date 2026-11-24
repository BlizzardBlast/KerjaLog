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
- [ ] Confirm prebuild adds a `tools:node="remove"` directive for `SCHEDULE_EXACT_ALARM` and the final merged Android manifest does not request the permission; delayed delivery from OS power management is acceptable for this feature.

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

## Task-based usability observation (formative, not a release gate)

The product's roughly 30-second Quick Capture objective is about a person's
ability to record useful work, not automated script speed. Complement the
required functional and accessibility checks with consented observations of
representative first-time users, when available.

### Setup and observation rules

- Use an isolated test install/profile, never a participant's personal app
  data. Prepare a completed-onboarding Home screen with a consistent
  synthetic configuration, no active draft and no unrelated entries.
  Recreate that baseline between independent capture attempts; retain only
  the intended synthetic entry for the follow-up task. Assess onboarding
  separately if in scope.
- Record the build revision, platform, language, device class and only
  accessibility/input settings material to the task. Record prior app
  familiarity; separate first attempts from practice or retest attempts.
- Read the same goal and supplied facts to each participant, without naming
  controls or explaining the navigation. Clarify task wording without
  coaching; record any navigation or task-solving help as assistance.
- Agree on a reasonable observation limit before sessions; it is not the
  30-second objective. Start timing at a consistent start cue after the
  participant understands the task, including hesitation before the first
  interaction. Record any declared completion separately; it does not stop
  the timer. Stop at the observable successful save confirmation for the
  intended action, abandonment, moderator termination or the observation
  limit. Do not pause during assistance.
- Independently verify the saved outcome after timing without changing
  the entry. Use the save-confirmation time for successful task duration
  only when the intended outcome is verified. A premature declaration,
  failed save or wrong entry cannot establish successful completion.
  If persistence is verified but no confirmation was observed, report
  the outcome separately with unverified completion time. A save confirmed
  after abandonment, termination or the limit is a late outcome, not
  successful completion within the observation window. Record the stop
  reason and do not retrospectively assign a successful duration.

### Synthetic tasks and outcome checks

- **Capture:** "While checking a fictional weekly report, you found seven
  duplicate records. Save a short note so you can remember the work later."
  Independently check after timing that a new, retrievable and editable
  quick note records the essential supplied fact without invented details.
  Accept equivalent wording; an unrelated entry, unsaved draft or fully
  developed entry does not establish Quick Capture success.
- **Refinement (known outcome):** In a separate attempt starting at Home with
  that saved quick note, tell the participant that correcting the seven
  duplicates allowed the fictional report to be submitted on schedule.
  Ask them to update the earlier note so they can remember the result.
  Verify that the same entry (not a duplicate) retains the original fact
  and records the supplied outcome without unsupported impact.
- **Refinement (unknown outcome):** Start at Home with a separate equivalent
  synthetic quick note whose outcome is unset and which contains no new
  supporting detail. Tell the participant that the seven duplicates were
  found across two sections of the fictional report, but what changed
  as a result is still unknown. Ask them to update the earlier note with
  what they now know, without guessing the result. Verify that the same
  entry retains the original facts, records the new detail in the note
  or supporting evidence and explicitly records an unknown outcome
  (rather than leaving the outcome unset). An unchanged entry, unsaved
  edit, duplicate or unsupported outcome/impact is not success. Do not
  require developed or review-ready maturity.
- If capture fails, use a separately prepared equivalent synthetic quick
  note for refinement and record the substitution; do not classify it as
  successful capture.

### Evidence, comparison and privacy

- Record verified completion within the observation window (unaided or
  assisted), incorrect completion, incomplete/abandoned attempts, late or
  unverified outcomes, and any missing completion-time evidence, alongside
  elapsed time, observable errors, confusion and assistance. Keep unaided
  and assisted verified successful durations separate from all other times;
  report perceived completion separately. Report sample size and
  denominators; do not treat roughly
  30 seconds as a hard per-person deadline or claim population-level
  results from a small sample.
- For retests, use comparable synthetic facts, starting state, task goal,
  build/device conditions and timing rules. Identify practice/order effects
  and material differences; avoid attributing changes to the UI alone when
  they cannot be controlled.
- Obtain consent; use local, access-restricted notes with non-identifying
  session IDs. Never collect real employer, client, colleague or work data.
  Do not collect screenshots, recordings or telemetry by default. Avoid
  reporting identifying combinations of settings or individual results;
  aggregate or suppress small groups when sharing. Delete notes and
  synthetic entries from the isolated test environment after the review
  and any agreed retest are complete, or sooner on withdrawal where possible.
- Separate functional defects from discoverability or comprehension findings;
  prioritize reproducible issues. A static prototype, scripted Maestro run
  or agent simulation is not observed human use. If no sessions run,
  report usability evidence as unverified.

This protocol does not replace any mandatory native, privacy, accessibility
or release checks above. It introduces no new product requirement, analytics,
service or automation.

## Dependency and repository security

- [ ] GitHub dependency graph is enabled.
- [ ] Dependabot alerts are enabled.
- [ ] Dependabot security updates are enabled or there is an equivalent documented dependency-remediation process.
- [ ] Review direct dependencies with no repository references before each release; remove them only after confirming they are not required by Expo config plugins, native generation, or package peer/runtime requirements.
- [ ] Investigate and remediate new dependency advisories before release.

## Pre-release schema note

Until the first distributed build containing valuable user data, local development installs may be recreated when `001-initial.ts` changes. After the first such distribution, shipped migrations become immutable and every schema change must use a new forward-only migration version.
