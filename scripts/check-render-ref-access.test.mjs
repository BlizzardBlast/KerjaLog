import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const checkerPath = fileURLToPath(
  new URL('./check-render-ref-access.mjs', import.meta.url),
);

function runChecker(source) {
  const directory = mkdtempSync(join(tmpdir(), 'kerjalog-ref-check-'));
  const sourcePath = join(directory, 'fixture.tsx');
  writeFileSync(sourcePath, source, 'utf8');

  try {
    return spawnSync(process.execPath, [checkerPath], {
      encoding: 'utf8',
      env: { ...process.env, REF_CHECK_SOURCE_ROOT: directory },
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('rejects direct render-phase ref reads', () => {
  const result = runChecker(`
    function Example() {
      const value = ref.current;
      return value;
    }
  `);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /fixture\.tsx:3/u);
});

test('allows ref access inside an event handler', () => {
  const result = runChecker(`
    function Example() {
      const handlePress = () => {
        ref.current += 1;
      };
      return handlePress;
    }
  `);

  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
});

test('rejects ref access hidden inside a render-time IIFE', () => {
  const result = runChecker(`
    function Example() {
      const value = (() => ref.current)();
      return value;
    }
  `);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /fixture\.tsx:3/u);
});
