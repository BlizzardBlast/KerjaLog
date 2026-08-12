import type { SQLiteDatabase } from 'expo-sqlite';

export async function migrateToVersion3(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE active_work_entry_draft (
      id INTEGER PRIMARY KEY NOT NULL CHECK(id = 1),
      step TEXT NOT NULL CHECK(step IN (
        'type',
        'event',
        'outcome',
        'evidence',
        'impact'
      )),
      intent TEXT CHECK(
        intent IS NULL OR intent IN (
          'completed',
          'solved',
          'helped',
          'feedback',
          'learned',
          'ownership',
          'challenge'
        )
      ),
      raw_note TEXT NOT NULL DEFAULT '',
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
      evidence_types TEXT NOT NULL DEFAULT '[]',
      evidence_detail TEXT NOT NULL DEFAULT '',
      impact_statement TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL CHECK(length(trim(updated_at)) > 0)
    );
  `);
}
