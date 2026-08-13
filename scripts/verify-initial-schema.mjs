import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const migrationSource = readFileSync(
  new URL('../src/data/migrations/001-initial.ts', import.meta.url),
  'utf8',
);
const schemaMatch = migrationSource.match(
  /export const INITIAL_SCHEMA_SQL = `([\s\S]*?)`;/u,
);

assert.ok(schemaMatch, 'Could not locate INITIAL_SCHEMA_SQL.');
const schemaSql = schemaMatch[1];
const db = new DatabaseSync(':memory:');

try {
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(schemaSql);

  const skills = db
    .prepare('SELECT id, name_key, category FROM skills ORDER BY id ASC')
    .all();
  assert.equal(skills.length, 10, 'Initial schema must seed ten broad skills.');
  assert.ok(
    skills.some(
      (skill) =>
        skill.id === 'attention_to_detail' &&
        skill.name_key === 'skill.attentionToDetail' &&
        skill.category === 'core',
    ),
    'Initial schema must seed localized skill identifiers.',
  );

  const insertEntry = db.prepare(`
    INSERT INTO work_entries (
      id,
      type,
      title,
      raw_note,
      impact_statement,
      occurred_at,
      outcome_type,
      status,
      excluded_from_exports,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEntry.run(
    'entry-1',
    'problem_solved',
    'Resolved reconciliation discrepancies',
    'Found duplicate reconciliation records.',
    'Removed duplicate records before submission.',
    '2026-08-10T08:00:00.000Z',
    'error_fixed_or_prevented',
    'review_ready',
    0,
    '2026-08-10T08:01:00.000Z',
    '2026-08-10T08:01:00.000Z',
  );

  db.prepare(`
    INSERT INTO entry_skills (entry_id, skill_id, source)
    VALUES (?, ?, ?)
  `).run('entry-1', 'attention_to_detail', 'rules');

  const entrySkill = db
    .prepare(
      'SELECT skill_id, source FROM entry_skills WHERE entry_id = ? ORDER BY skill_id',
    )
    .get('entry-1');
  assert.equal(entrySkill?.skill_id, 'attention_to_detail');
  assert.equal(entrySkill?.source, 'rules');

  const search = db.prepare(`
    SELECT entry_id
    FROM work_entry_history_fts
    WHERE work_entry_history_fts MATCH ?
  `);

  const searchIds = (query) => search.all(query).map((row) => row.entry_id);

  assert.deepEqual(searchIds('"reconciliation"*'), ['entry-1']);

  db.prepare(`
    INSERT INTO evidence (id, entry_id, type, text_value, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'evidence-1',
    'entry-1',
    'number',
    'proofseven entries removed',
    '2026-08-10T08:02:00.000Z',
  );

  assert.deepEqual(searchIds('"proofseven"*'), ['entry-1']);

  db.prepare('UPDATE evidence SET text_value = ? WHERE id = ?').run(
    'proofnine corrected',
    'evidence-1',
  );

  assert.deepEqual(searchIds('"proofseven"*'), []);
  assert.deepEqual(searchIds('"proofnine"*'), ['entry-1']);

  db.prepare('UPDATE work_entries SET title = ? WHERE id = ?').run(
    'Closed monthly reconciliation',
    'entry-1',
  );

  assert.deepEqual(searchIds('"monthly"*'), ['entry-1']);

  db.prepare('DELETE FROM evidence WHERE id = ?').run('evidence-1');
  assert.deepEqual(searchIds('"proofnine"*'), []);

  db.prepare('DELETE FROM work_entries WHERE id = ?').run('entry-1');
  assert.deepEqual(searchIds('"monthly"*'), []);
  assert.equal(
    db.prepare('SELECT COUNT(*) AS count FROM entry_skills').get().count,
    0,
    'Deleting an entry must cascade its confirmed skills.',
  );

  const plan = db
    .prepare(`
      EXPLAIN QUERY PLAN
      SELECT id
      FROM work_entries
      WHERE id IN (
        SELECT entry_id
        FROM work_entry_history_fts
        WHERE work_entry_history_fts MATCH ?
      )
      ORDER BY occurred_at DESC, created_at DESC, id DESC
      LIMIT 51
    `)
    .all('"monthly"*')
    .map((row) => row.detail);

  assert.ok(
    plan.some((detail) =>
      detail.includes('SCAN work_entry_history_fts VIRTUAL TABLE INDEX'),
    ),
    'History search must use the FTS virtual-table index.',
  );
} finally {
  db.close();
}
