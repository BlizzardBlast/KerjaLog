from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# GitHub Actions' repository token cannot create/update workflow files unless it
# has the separate workflows permission. Keep the validated code/materialized
# lockfile commit free of workflow-file changes; workflow cleanup is applied
# afterward through the connected GitHub API.
(ROOT / '.github/workflows/ci.yml').write_text(
    '''name: CI

on:
  pull_request:
  push:
    branches:
      - main

permissions:
  contents: read

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Set up pnpm
        uses: pnpm/action-setup@v6
        with:
          version: 11.20.0
          run_install: false

      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 24.18.1
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Check formatting
        run: pnpm format:check

      - name: Typecheck
        run: pnpm typecheck

      - name: React Compiler healthcheck
        run: pnpm run compiler:check

      - name: Check render ref purity
        run: pnpm run react:refs:check

      - name: Verify initial SQLite schema
        run: pnpm run schema:check

      - name: Test
        run: pnpm test:ci

      - name: Expo Doctor
        run: pnpm run expo:doctor

      - name: Verify generated native configuration
        run: pnpm run native:check
        env:
          NODE_ENV: development

      - name: Export Android bundle
        run: pnpm run export:android

      - name: Export iOS bundle
        run: pnpm run export:ios
''',
    encoding='utf-8',
)

print('Restored workflow files before materializer push.')
