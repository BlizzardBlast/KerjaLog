# KerjaLog

KerjaLog is a private, local-first career achievement tracker for office workers. It helps users capture everyday work, understand the impact of their contributions, preserve evidence, and prepare stronger material for performance reviews, one-on-ones, resumes, and interviews.

> **Catat kerja. Lihat perkembangan. Siap saat dinilai.**

## Product and architecture direction

The canonical v1 product scope, technical assessment, architecture, privacy model, and explicit **do / do not** rules live in:

- [Product Direction and Technical Architecture](./docs/PRODUCT_AND_ARCHITECTURE.md)

Read that document before making major product, persistence, backend, AI, synchronization, or infrastructure decisions.

## v1 at a glance

KerjaLog v1 is intentionally:

- Android and iOS from one Expo/React Native codebase;
- local-first and usable without an account or internet connection;
- backed by encrypted SQLite on the device;
- centered on Quick Capture, Impact Builder, History, weekly reflection, Growth evidence, Review Builder, and export;
- Indonesian- and English-capable;
- AI-free, backend-free, and cloud-sync-free in the core product-validation milestone.

**Web is not a supported v1 product target.** Do not add web-specific compatibility code, layout workarounds, acceptance criteria, or CI gates when they would add complexity or compromise Android/iOS quality, performance, or maintainability. Shared React Native code may happen to run on web, but that is incidental and is not a release requirement.

The app should **not** become a task manager, time tracker, employer dashboard, social network, or AI wrapper.

## Current stack

The repository currently uses:

- Expo SDK 57
- React Native 0.86.2
- React 19.2.3
- TypeScript 6 with strict mode
- Expo Router
- Expo development builds / dev client
- React Native Reanimated
- pnpm

The architecture document lists the additional v1 dependencies that should be introduced deliberately as their corresponding features are implemented.

## Development

KerjaLog uses an Expo development build rather than Expo Go because the app relies on native capabilities such as SQLCipher, biometrics, notifications, screen privacy, and a local Expo module.

Install dependencies:

```bash
pnpm install
```

Create or rebuild the local development client when native dependencies or app configuration change:

```bash
pnpm android
pnpm ios
```

For normal JavaScript/TypeScript iteration after the development client is installed, start Metro in dev-client mode:

```bash
pnpm start
```

You normally do not need to rebuild the native client for JavaScript/TypeScript-only changes. Rebuild it after changing native dependencies, Expo config plugins, `app.json`, or native module code.

## Engineering rule

Keep v1 boring where boring is good:

```text
SQLite = persisted product data
Zustand = ephemeral UI/workflow state
TanStack Form = active form state
Network = optional, never required for core entry capture/read
```

If a proposed feature requires accounts, cloud sync, remote AI, workplace integrations, attachments, or another service, treat it as post-v1 unless the product direction is deliberately revised first.
