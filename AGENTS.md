# Expo HAS CHANGED

Read the exact versioned docs at <https://docs.expo.dev/versions/v57.0.0/> before writing any code.

## UI design system

Read `DESIGN.md` in the project root before changing UI. If `prototype/index.html` exists, read it as a visual reference and match its hierarchy, spacing, and component intent through the native design system.

This app uses Expo Router and React Native. There is no global CSS or HTML-head stylesheet to import. Use existing theme tokens, utilities, component anatomy, spacing, typography, and states from `DESIGN.md`; do not invent a parallel visual style or hard-code colors outside token definitions. When existing components conflict with `DESIGN.md`, explain the conflict and choose the option that keeps the interface most consistent.
