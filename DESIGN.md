# KerjaLog design system

Read this document before changing product UI. `prototype/index.html` is a visual reference when it exists; runtime UI is implemented with Expo React Native components, not its HTML or CSS.

## Runtime source of truth

- Theme colors, spacing, radii, layout, and typography live in `src/design-system/tokens/theme.ts`.
- Reuse `Text`, `TextField`, `Button`, theme hooks, and existing feature components before adding new primitives.
- This Expo Router app has no global CSS entry point. Do not create a web stylesheet, HTML `<link>`, or hard-coded color system for native screens. Use theme tokens and `StyleSheet`.
- Design behavior must work in light and dark themes, at narrow phone widths, with Dynamic Type, and in English and Indonesian.

## Foundations

- `canvas` is app background. `surface` is standard screen/card/control background. `surfaceSubtle` and `surfaceMuted` group quieter content.
- `primary` is the sole default action and emphasis color. `primarySoft` with a `primary` border marks evidence, impact, and related highlighted saved-entry metadata.
- `success`, `warning`, and `danger` are semantic-only. Destructive actions use the `destructive` Button variant and retain confirmation before mutation.
- Use spacing tokens only. Default screen padding is `layout.screenHorizontalPadding`; standard card padding is `spacing[4]`; card grouping is `spacing[3]` or `spacing[4]`.
- Standard cards use `radii.lg`, a one-pixel token border, and tokenized background. Evidence-thread cards use `radii.xl`.
- Use `Text` variants, never ad-hoc font sizes: title for screen titles, heading for card/section headings, body/bodyStrong for content, label for controls, caption for supporting copy, and overline for compact section labels.

## Components and states

- Buttons are at least 48dp high. Use primary for a form's commit action, secondary for non-destructive alternatives, ghost for low-emphasis actions, and destructive only for destructive confirmation paths.
- Inputs are controlled by one canonical state owner. Persisted validated forms use `@tanstack/react-form`; input updates remain synchronous. Keyboard submit and button press must share one submit handler.
- Disabled, loading, validation, and mutation-error states must be visible and exposed through React Native accessibility state or live-region alert text. Do not rely on color alone.
- Preserve text wrapping for long names. Rows may wrap action groups; text must shrink/wrap before controls clip. Do not truncate content that identifies a saved record.

## Accessibility and adaptation

- Use visible labels plus accessibility labels/labelled-by relationships. Headings expose header semantics. Progress and button busy/disabled state are programmatic.
- Inline validation and recoverable mutation failures use `role="alert"` and `accessibilityLiveRegion="polite"`.
- Do not disable Dynamic Type. Use existing text ramps, flexible layouts, wrapped button labels, and 48dp minimum targets.
- Check Android and iOS rendering, light and dark themes, 320dp width, and large text after visual changes.
