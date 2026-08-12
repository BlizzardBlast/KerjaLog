import type { SQLiteDatabase } from 'expo-sqlite';

export async function migrateToVersion1(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE work_entries (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      raw_note TEXT NOT NULL,
      impact_statement TEXT,
      occurred_at TEXT NOT NULL,
      outcome_type TEXT,
      status TEXT NOT NULL,
      excluded_from_exports INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE evidence (
      id TEXT PRIMARY KEY NOT NULL,
      entry_id TEXT NOT NULL,
      type TEXT NOT NULL,
      text_value TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (entry_id)
        REFERENCES work_entries(id)
        ON DELETE CASCADE
    );

    CREATE INDEX idx_work_entries_occurred_at
      ON work_entries(occurred_at DESC);

    CREATE INDEX idx_evidence_entry_id
      ON evidence(entry_id);
  `);
}
