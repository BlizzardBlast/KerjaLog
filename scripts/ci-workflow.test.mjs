import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

const workflowDirectory = new URL('../.github/workflows/', import.meta.url);
const source = readFileSync(new URL('ci.yml', workflowDirectory), 'utf8').replaceAll('\r\n', '\n');
const githubExpression = '$' + '{{ github.event_name == ' +
  "'pull_request' && github.event.pull_request.number || github.event_name == " +
  "'push' && github.ref || github.run_id }}";

test('all pull-request workflows are accounted for', () => {
  const names = readdirSync(workflowDirectory).filter((name) => /\.ya?ml$/u.test(name));
  const withPullRequests = names.filter((name) =>
    /^ {2}pull_request:\s*$/mu.test(readFileSync(new URL(name, workflowDirectory), 'utf8')),
  );
  assert.deepEqual(withPullRequests.sort(), ['ci.yml']);
});

test('draft CI runs only when ready, including a stale ready-for-review payload', () => {
  const types = source.match(/^ {4}types: \[([^\]]+)\]$/mu);
  assert.ok(types, 'Explicit PR event types are required');
  assert.deepEqual(types[1].split(',').map((event) => event.trim()), [
    'opened',
    'reopened',
    'synchronize',
    'ready_for_review',
    'converted_to_draft',
  ]);
  assert.match(source, /^ {2}push:\n {4}branches:\n {6}- main$/mu);
  const condition = source.match(/^ {4}if: >-\n((?:^ {6}.+(?:\n|$))+)/mu);
  assert.ok(condition, 'The validation job must have a draft gate');
  assert.equal(condition[1].trim().replace(/\s+/gu, ' '),
    "github.event_name != 'pull_request' || " +
    "!github.event.pull_request.draft || github.event.action == 'ready_for_review'");
});

test('PR runs cancel superseded work and main pushes coalesce pending work', () => {
  const group = source.match(/^ {2}group: (.+)$/mu);
  assert.ok(group);
  assert.equal(group[1], 'ci-' + '$' + '{{ github.workflow }}-' + githubExpression);
  assert.match(source, /^ {2}cancel-in-progress: \$\{\{ github.event_name == 'pull_request' \}\}$/mu);
  assert.match(source, /^permissions:\n {2}contents: read$/mu);
});

test('all Expo/native validation commands remain in the one CI job', () => {
  const jobs = source.split(/^jobs:\s*$/mu)[1];
  assert.ok(jobs, 'Missing jobs section');
  assert.deepEqual([...jobs.matchAll(/^ {2}([a-z][a-z-]*):$/gmu)].map((match) => match[1]), ['validate']);
  assert.deepEqual(
    [...source.matchAll(/^ {8}run: (pnpm .+)$/gmu)].map((match) => match[1]),
    [
      'pnpm install --frozen-lockfile',
      'pnpm lint',
      'pnpm format:check',
      'pnpm typecheck',
      'pnpm run compiler:check',
      'pnpm run schema:check',
      'pnpm test:ci',
      'pnpm run expo:doctor',
      'pnpm run native:check',
      'pnpm run export:android',
      'pnpm run export:ios',
    ],
  );
});
