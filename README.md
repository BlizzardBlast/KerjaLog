# KerjaLog — interactive mobile prototype

A high-fidelity HTML prototype for **KerjaLog**, a private work-growth companion for early-career office workers.

> **Catat kerja. Lihat perkembangan. Siap saat dinilai.**

The prototype is intentionally dependency-free: open `index.html` directly in a modern browser, or serve the repository locally.

```bash
python3 -m http.server 4173
# open http://localhost:4173
```

## Prototype scope

The prototype contains 16 connected mobile screens:

1. Welcome
2. Work area & career level
3. Main goal
4. Review schedule & reminder
5. Home
6. Quick Capture event type
7. Work-event input
8. Outcome discovery
9. Optional evidence
10. Impact Builder
11. Saved entry detail
12. Searchable history
13. Growth Evidence Map
14. Skill evidence detail
15. Review Builder
16. Editable generated review summary

The primary flow is:

**Onboarding → Home → Quick Capture → Outcome → Evidence → Impact Builder → Saved Entry → Growth → Review Builder**

## Product principles represented

- Beginner-first language; users do not need to know STAR, KPIs, or competency frameworks.
- Small and routine work counts.
- Capture is guided one question at a time rather than a long form.
- Evidence is optional and may be qualitative.
- KerjaLog never invents impact; assumptions must be confirmed.
- Growth shows evidence counts, not performance scores.
- Challenges stay private unless the user intentionally includes them.
- No streaks, leaderboards, employer dashboard, or social features.
- Local-first privacy language, biometric/PIN protection, and confidentiality reminders are part of the experience.

## Design system

The visual direction uses vivid purple as a concentrated interaction accent, warm neutral surfaces, semantic green/amber states, generous spacing, and a mobile-first 390×844 reference viewport.

The signature interaction is the **Evidence Thread**:

**What happened → What changed → What supports it → What this demonstrates**

It appears in the Impact Builder, entry details, and skill evidence to make KerjaLog's core transformation visible without introducing scores or gamification.

## Prototype controls

- Light/dark theme toggle
- English/Bahasa Indonesia preview on onboarding
- Desktop-only screen jump list for design review
- Searchable history
- Interactive selection states
- Weekly-reflection bottom sheet
- Editable review summary
- Copy, Markdown download, browser PDF print, and share actions

## Implementation notes

This is a design prototype, not the production React Native application. Its layout and tokens deliberately map cleanly to React Native concepts (`View`, `Text`, `Pressable`, Flexbox, theme tokens, and tab navigation) so it can be used as the visual/interaction source of truth for the mobile implementation.
