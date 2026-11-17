import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

const workflowDirectory = new URL('../.github/workflows/', import.meta.url);
const source = readFileSync(
  new URL('ci.yml', workflowDirectory),
  'utf8',
).replaceAll('\r\n', '\n');
// PR-related webhook events may have distinct trust and billing semantics.
const prRelatedEvents = new Set([
  'pull_request',
  'pull_request_target',
  'pull_request_review',
  'pull_request_review_comment',
  'issue_comment',
]);

const githubExpression =
  '$' +
  "{{ github.event_name == 'pull_request' && " +
  "github.event.pull_request.number || github.event_name == 'push' && " +
  'github.ref || github.run_id }}';


/**
 * Require canonical mapping keys for CI policy tests, without a YAML parser dependency.
 * Reject duplicate keys and spellings such as "permissions :" before regex checks.
 */
function assertCanonicalMappings(source) {
  const scopes = [];
  let scalarIndent = -1;
  const lines = source.replaceAll('\r\n', '\n').split('\n');
  for (const [index, line] of lines.entries()) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const spaces = /^ */.exec(line)[0].length;
    if (scalarIndent >= 0 && spaces > scalarIndent) continue;
    scalarIndent = -1;
    assert.ok(
      !line.slice(spaces).startsWith('\t'),
      'Unsupported YAML mapping key or syntax at line ' + (index + 1),
    );
    let content = line.slice(spaces);
    let indent = spaces;
    const sequenceItem = content.startsWith('- ');
    if (sequenceItem) {
      while (scopes.length && scopes.at(-1).indent >= spaces) scopes.pop();
      content = content.slice(2);
      indent += 2;
    }
    // Fail closed on explicit, tagged, aliased and noncanonical key syntax.
    // Unrecognized YAML cannot silently bypass the following policy checks.
    const entry = /^([a-zA-Z_][\w.-]*):(?=\s|$)/.exec(content);
    if (!entry) {
      assert.ok(
        sequenceItem && !/^(?:[?!&*:]|<<)/.test(content),
        'Unsupported YAML mapping key or syntax at line ' + (index + 1),
      );
      continue;
    }
    while (scopes.length && scopes.at(-1).indent > indent) scopes.pop();
    if (!scopes.length || scopes.at(-1).indent < indent) {
      scopes.push({ indent, keys: new Set() });
    }
    assert.ok(
      !scopes.at(-1).keys.has(entry[1]),
      'Duplicate YAML mapping key at line ' + (index + 1),
    );
    scopes.at(-1).keys.add(entry[1]);
    const value = content.slice(entry[0].length).trim();
    if (/^[|>][-+]?(\s+#.*)?$/.test(value)) scalarIndent = indent;
  }
}

assertCanonicalMappings(source);

// Reject unsupported YAML event forms rather than silently missing workflows.
function topLevelBlock(text, key) {
  const lines = text.replaceAll('\r\n', '\n').split('\n');
  const start = lines.indexOf(key + ':');
  assert.notEqual(start, -1, 'Missing ' + key + ' block');
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index++) {
    const line = lines[index];
    if (!line.trim() || line.trimStart().startsWith('#')) {
      continue;
    }
    if (!line.startsWith(' ')) {
      end = index;
      break;
    }
  }
  return lines.slice(start + 1, end).join('\n');
}

function workflowTriggers(text) {
  assertCanonicalMappings(text);
  assert.equal(
    [...text.matchAll(/^on:/gmu)].length,
    1,
    'Expected exactly one block-style on: declaration',
  );
  const declarations = topLevelBlock(text, 'on')
    .split('\n')
    .filter(
      (line) => /^ {2}\S/u.test(line) && !line.trimStart().startsWith('#'),
    );
  assert.ok(declarations.length > 0, 'A workflow must declare an event');
  for (const line of declarations) {
    assert.match(
      line,
      /^ {2}[a-z_][a-z_0-9-]*:$/u,
      'Unsupported workflow event syntax',
    );
  }
  return declarations.map((line) => line.trim().slice(0, -1));
}

function relatedTriggers(text) {
  return workflowTriggers(text).filter((event) => prRelatedEvents.has(event));
}

function auditedWorkflowNames(filenames, readWorkflow) {
  return filenames.filter(
    (filename) => relatedTriggers(readWorkflow(filename)).length > 0,
  );
}

function assertReadOnlyPermissions(text) {
  assertCanonicalMappings(text);
  assert.equal(
    [...text.matchAll(/^permissions:/gmu)].length,
    1,
    'Exactly one top-level permissions block is required',
  );
  const entries = topLevelBlock(text, 'permissions')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
  assert.deepEqual(
    entries,
    ['contents: read'],
    'Unexpected workflow permissions',
  );
  assert.doesNotMatch(
    topLevelBlock(text, 'jobs'),
    /^ {4}permissions:/mu,
    'Unexpected job-level permission override',
  );
}

test('all pull-request workflows are accounted for', () => {
  const names = readdirSync(workflowDirectory).filter((name) =>
    /\.ya?ml$/u.test(name),
  );
  const withPullRequests = auditedWorkflowNames(
    names,
    (name) => readFileSync(new URL(name, workflowDirectory), 'utf8'),
  );
  assert.deepEqual(withPullRequests.sort(), ['ci.yml']);
});

test('draft gate handles stale ready-for-review payloads', () => {
  assert.deepEqual(
    relatedTriggers(source),
    ['pull_request'],
    'Another PR-related trigger requires a separately reviewed policy',
  );
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
  assert.equal(
    condition[1].trim().replace(/\s+/gu, ' '),
    "github.event_name != 'pull_request' || " +
      "!github.event.pull_request.draft || " +
      "github.event.action == 'ready_for_review'",
  );
});

test('PR cancellation and main push coalescing are isolated', () => {
  const group = source.match(/^ {2}group: (.+)$/mu);
  assert.ok(group);
  assert.equal(
    group[1],
    'ci-' + '$' + '{{ github.workflow }}-' + githubExpression,
  );
  const cancel = source.match(/^ {2}cancel-in-progress: (.+)$/mu);
  assert.equal(
    cancel?.[1],
    '$' + "{{ github.event_name == 'pull_request' }}",
  );
  assertReadOnlyPermissions(source);
});

test('all Expo/native checks remain in the single CI job', () => {
  const jobs = source.split(/^jobs:\s*$/mu)[1];
  assert.ok(jobs, 'Missing jobs section');
  assert.deepEqual(
    [...jobs.matchAll(/^ {2}([a-z][a-z-]*):$/gmu)].map((match) => match[1]),
    ['validate'],
  );
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

test('unsupported inline event syntax cannot evade workflow inventory', () => {
  assert.throws(
    () => workflowTriggers('name: unsafe\non: [pull_request]\njobs:\n'),
    /Missing on block/,
  );
  assert.throws(
    () => workflowTriggers('on:\n  pull_request: {}\n'),
    /Unsupported workflow event syntax/,
  );
});

test('extra token permissions and job-level overrides are rejected', () => {
  assertReadOnlyPermissions(source);
  assert.throws(
    () => assertReadOnlyPermissions(
      source.replace('  contents: read', '  contents: read\n  actions: write'),
    ),
    /Unexpected workflow permissions/,
  );
  assert.throws(
    () => assertReadOnlyPermissions(
      source.replace(
        '    runs-on: ubuntu-24.04',
        '    permissions:\n      contents: write\n    runs-on: ubuntu-24.04',
      ),
    ),
    /Unexpected job-level permission override/,
  );
});

test('review and target PR events cannot evade the workflow inventory', () => {
  for (const event of prRelatedEvents) {
    const names = auditedWorkflowNames(
      ['ci.yml', 'unreviewed.yml'],
      (name) => name === 'ci.yml' ? source : 'on:\n  ' + event + ':\n',
    );
    assert.deepEqual(names.sort(), ['ci.yml', 'unreviewed.yml']);
  }
});

test('noncanonical and duplicate YAML keys cannot bypass CI policy', () => {
  const safe = source;
  const cases = [
    safe.replace(
      '    runs-on: ubuntu-24.04',
      '    ? permissions\n    :\n      contents: write\n    runs-on: ubuntu-24.04',
    ),
    safe.replace(
      '    runs-on: ubuntu-24.04',
      '    ? if\n    : true\n    runs-on: ubuntu-24.04',
    ),
    safe.replace(
      '    runs-on: ubuntu-24.04',
      '    !!str permissions:\n      contents: write\n    runs-on: ubuntu-24.04',
    ),
    safe.replace(
      '    runs-on: ubuntu-24.04',
      '    permissions :\n      contents: write\n    runs-on: ubuntu-24.04',
    ),
    safe.replace(
      '    runs-on: ubuntu-24.04',
      '    if : true\n    runs-on: ubuntu-24.04',
    ),
    safe.replace(
      '\npermissions:\n',
      '\non :\n  pull_request_target:\n\npermissions:\n',
    ),
    safe.replace(
      '\npermissions:\n',
      '\npermissions :\n  contents: write\n\npermissions:\n',
    ),
    safe.replace(
      '  pull_request:\n',
      '  pull_request:\n  pull_request :\n',
    ),
    safe.replace(
      '    runs-on: ubuntu-24.04',
      '    if: true\n    runs-on: ubuntu-24.04',
    ),
    safe.replace(
      '    runs-on: ubuntu-24.04',
      '    "permissions":\n      contents: write\n    runs-on: ubuntu-24.04',
    ),
  ];
  for (const unsafe of cases) {
    assert.notEqual(unsafe, safe, 'Negative fixture must modify the workflow');
    assert.throws(() => assertCanonicalMappings(unsafe), /YAML mapping key/);
  }
  const elevated = safe.replace(
    '    runs-on: ubuntu-24.04',
    '    permissions:\n      contents: write\n    runs-on: ubuntu-24.04',
  );
  assert.throws(
    () => assertReadOnlyPermissions(elevated),
    /Unexpected job-level permission override/,
  );
  // Block scalar script content and distinct sequence items remain allowed.
  assertCanonicalMappings(
    'jobs:\n  sample:\n    steps:\n' +
      '      - run: |\n          permissions :\n          on :\n' +
      '      - run: echo ok\n',
  );
});
