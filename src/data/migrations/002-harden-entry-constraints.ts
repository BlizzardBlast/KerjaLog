import type { SQLiteDatabase } from 'expo-sqlite';

export async function migrateToVersion2(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE work_entries_v2 (
      id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
      type TEXT NOT NULL CHECK(type IN (
        'contribution',
        'problem_solved',
        'feedback',
        'learning',
        'ownership',
        'challenge'
      )),
      title TEXT NOT NULL CHECK(length(trim(title)) > 0),
      raw_note TEXT NOT NULL CHECK(length(trim(raw_note)) > 0),
      impact_statement TEXT CHECK(
        impact_statement IS NULL OR length(trim(impact_statement)) > 0
      ),
      occurred_at TEXT NOT NULL CHECK(length(trim(occurred_at)) > 0),
      outcome_type TEXT CHECK(
        outcome_type IS NULL OR outcome_type IN (
          'deadline_met',
          'error_fixed_or_prevented',
          'work_faster',
          'work_clearer',
          'person_helped',
          'risk_reduced',
          'decision_enabled',
          'skill_gained',
          'unsure'
        )
      ),
      status TEXT NOT NULL CHECK(status IN (
        'quick_note',
        'developed',
        'review_ready'
      )),
      excluded_from_exports INTEGER NOT NULL DEFAULT 0 CHECK(
        excluded_from_exports IN (0, 1)
      ),
      created_at TEXT NOT NULL CHECK(length(trim(created_at)) > 0),
      updated_at TEXT NOT NULL CHECK(length(trim(updated_at)) > 0)
    );

    CREATE TABLE evidence_v2 (
      id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
      entry_id TEXT NOT NULL CHECK(length(trim(entry_id)) > 0),
      type TEXT NOT NULL CHECK(type IN (
        'number',
        'deadline',
        'result',
        'feedback',
        'people_helped',
        'reference_link',
        'supporting_note'
      )),
      text_value TEXT NOT NULL CHECK(length(trim(text_value)) > 0),
      created_at TEXT NOT NULL CHECK(length(trim(created_at)) > 0),
      FOREIGN KEY (entry_id)
        REFERENCES work_entries_v2(id)
        ON DELETE CASCADE,
      UNIQUE (entry_id, type)
    );

    INSERT INTO work_entries_v2 (
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
    SELECT
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
    FROM work_entries;

    INSERT INTO evidence_v2 (
      id,
      entry_id,
      type,
      text_value,
      created_at
    )
    SELECT
      id,
      entry_id,
      type,
      text_value,
      created_at
    FROM evidence;

    DROP TABLE evidence;
    DROP TABLE work_entries;

    ALTER TABLE work_entries_v2 RENAME TO work_entries;
    ALTER TABLE evidence_v2 RENAME TO evidence;

    CREATE INDEX idx_work_entries_occurred_at
      ON work_entries(occurred_at DESC);

    CREATE INDEX idx_evidence_entry_id
      ON evidence(entry_id);
  `);
}
