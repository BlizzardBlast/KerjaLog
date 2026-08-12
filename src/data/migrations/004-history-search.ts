import type { SQLiteDatabase } from 'expo-sqlite';

export async function migrateToVersion4(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE VIRTUAL TABLE work_entry_history_fts USING fts5(
      entry_id UNINDEXED,
      title,
      raw_note,
      impact_statement,
      evidence_text,
      tokenize = 'unicode61 remove_diacritics 2'
    );

    INSERT INTO work_entry_history_fts (
      entry_id,
      title,
      raw_note,
      impact_statement,
      evidence_text
    )
    SELECT
      work_entries.id,
      work_entries.title,
      work_entries.raw_note,
      COALESCE(work_entries.impact_statement, ''),
      COALESCE((
        SELECT group_concat(DISTINCT evidence.text_value)
        FROM evidence
        WHERE evidence.entry_id = work_entries.id
      ), '')
    FROM work_entries;

    CREATE TRIGGER work_entry_history_after_insert
    AFTER INSERT ON work_entries
    BEGIN
      INSERT INTO work_entry_history_fts (
        entry_id,
        title,
        raw_note,
        impact_statement,
        evidence_text
      )
      VALUES (
        NEW.id,
        NEW.title,
        NEW.raw_note,
        COALESCE(NEW.impact_statement, ''),
        ''
      );
    END;

    CREATE TRIGGER work_entry_history_after_update
    AFTER UPDATE OF title, raw_note, impact_statement ON work_entries
    BEGIN
      UPDATE work_entry_history_fts
      SET
        title = NEW.title,
        raw_note = NEW.raw_note,
        impact_statement = COALESCE(NEW.impact_statement, '')
      WHERE entry_id = NEW.id;
    END;

    CREATE TRIGGER work_entry_history_after_delete
    AFTER DELETE ON work_entries
    BEGIN
      DELETE FROM work_entry_history_fts
      WHERE entry_id = OLD.id;
    END;

    CREATE TRIGGER work_entry_history_evidence_after_insert
    AFTER INSERT ON evidence
    BEGIN
      UPDATE work_entry_history_fts
      SET evidence_text = COALESCE((
        SELECT group_concat(DISTINCT evidence.text_value)
        FROM evidence
        WHERE evidence.entry_id = NEW.entry_id
      ), '')
      WHERE entry_id = NEW.entry_id;
    END;

    CREATE TRIGGER work_entry_history_evidence_after_update
    AFTER UPDATE OF entry_id, text_value ON evidence
    BEGIN
      UPDATE work_entry_history_fts
      SET evidence_text = COALESCE((
        SELECT group_concat(DISTINCT evidence.text_value)
        FROM evidence
        WHERE evidence.entry_id = OLD.entry_id
      ), '')
      WHERE entry_id = OLD.entry_id;

      UPDATE work_entry_history_fts
      SET evidence_text = COALESCE((
        SELECT group_concat(DISTINCT evidence.text_value)
        FROM evidence
        WHERE evidence.entry_id = NEW.entry_id
      ), '')
      WHERE entry_id = NEW.entry_id;
    END;

    CREATE TRIGGER work_entry_history_evidence_after_delete
    AFTER DELETE ON evidence
    BEGIN
      UPDATE work_entry_history_fts
      SET evidence_text = COALESCE((
        SELECT group_concat(DISTINCT evidence.text_value)
        FROM evidence
        WHERE evidence.entry_id = OLD.entry_id
      ), '')
      WHERE entry_id = OLD.entry_id;
    END;
  `);
}
