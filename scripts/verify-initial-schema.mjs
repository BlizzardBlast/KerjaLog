import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';

const migrationSource = readFileSync(
  new URL('../src/data/migrations/001-initial.ts', import.meta.url),
  'utf8',
);
const skillCatalogSource = readFileSync(
  new URL('../src/domain/skill/catalog.ts', import.meta.url),
  'utf8',
);
const schemaMatch = migrationSource.match(
  /export const INITIAL_SCHEMA_SQL = `([\s\S]*?)`;/u,
);

assert.ok(schemaMatch, 'Could not locate INITIAL_SCHEMA_SQL.');
const schemaSql = schemaMatch[1];
const db = new DatabaseSync(':memory:');

const catalogSkillSignatures = readSkillCatalogSignatures(skillCatalogSource);
assert.equal(
  catalogSkillSignatures.length,
  10,
  'Runtime skill catalog must contain the ten broad v1 skills.',
);

try {
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(schemaSql);

  const databaseSkillSignatures = db
    .prepare(
      'SELECT id, slug, name_key, category FROM skills ORDER BY id ASC',
    )
    .all()
    .map(
      (skill) =>
        `${skill.id}|${skill.slug}|${skill.name_key}|${skill.category}`,
    )
    .sort();

  assert.deepEqual(
    databaseSkillSignatures,
    catalogSkillSignatures,
    'Initial SQLite skill seed must exactly match the runtime skill catalog.',
  );

  const insertEntry = db.prepare(`
    INSERT INTO work_entries (
      id,
      type,
      title,
      raw_note,
      impact_statement,
      impact_statement_source,
      occurred_at,
      outcome_type,
      status,
      excluded_from_exports,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEntry.run(
    'entry-1',
    'problem_solved',
    'Resolved reconciliation discrepancies',
    'Found duplicate reconciliation records.',
    'Removed duplicate records before submission.',
    'generated',
    '2026-08-10T08:00:00.000Z',
    'error_fixed_or_prevented',
    'review_ready',
    0,
    '2026-08-10T08:01:00.000Z',
    '2026-08-10T08:01:00.000Z',
  );

  assert.throws(
    () =>
      insertEntry.run(
        'entry-invalid-impact-source',
        'contribution',
        'Invalid entry',
        'This entry should not persist.',
        'Impact without provenance.',
        null,
        '2026-08-10T08:00:00.000Z',
        'deadline_met',
        'developed',
        0,
        '2026-08-10T08:01:00.000Z',
        '2026-08-10T08:01:00.000Z',
      ),
    /CHECK constraint failed/u,
    'Saved impact statements must require provenance.',
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

function readSkillCatalogSignatures(source) {
  const sourceFile = ts.createSourceFile(
    'catalog.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  const declaration = sourceFile.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) => [...statement.declarationList.declarations])
    .find(
      (candidate) =>
        ts.isIdentifier(candidate.name) && candidate.name.text === 'SKILL_CATALOG',
    );

  assert.ok(declaration?.initializer, 'Could not locate SKILL_CATALOG.');
  const initializer = unwrapExpression(declaration.initializer);
  assert.ok(
    ts.isArrayLiteralExpression(initializer),
    'SKILL_CATALOG must remain an array literal so schema drift is verifiable.',
  );

  return initializer.elements
    .map((element) => {
      const entry = unwrapExpression(element);
      assert.ok(
        ts.isObjectLiteralExpression(entry),
        'Each SKILL_CATALOG entry must remain an object literal.',
      );

      const id = readStringProperty(entry, 'id');
      const nameKey = readStringProperty(entry, 'nameKey');
      const category = readStringProperty(entry, 'category');
      return `${id}|${id}|${nameKey}|${category}`;
    })
    .sort();
}

function unwrapExpression(expression) {
  let current = expression;

  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }

  return current;
}

function readStringProperty(objectLiteral, propertyName) {
  const property = objectLiteral.properties.find(
    (candidate) =>
      ts.isPropertyAssignment(candidate) &&
      ((ts.isIdentifier(candidate.name) && candidate.name.text === propertyName) ||
        (ts.isStringLiteral(candidate.name) &&
          candidate.name.text === propertyName)),
  );

  assert.ok(
    property && ts.isPropertyAssignment(property),
    `Skill catalog entry is missing ${propertyName}.`,
  );
  const value = unwrapExpression(property.initializer);
  assert.ok(
    ts.isStringLiteralLike(value),
    `Skill catalog ${propertyName} must be a string literal.`,
  );
  return value.text;
}
