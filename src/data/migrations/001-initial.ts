import type { SQLiteDatabase } from 'expo-sqlite';

export const INITIAL_SCHEMA_SQL = `
  CREATE TABLE work_areas (
    id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
    name TEXT NOT NULL CHECK(length(trim(name)) > 0),
    name_key TEXT NOT NULL CHECK(length(trim(name_key)) > 0),
    archived_at TEXT,
    created_at TEXT NOT NULL CHECK(length(trim(created_at)) > 0),
    updated_at TEXT NOT NULL CHECK(length(trim(updated_at)) > 0)
  );

  CREATE TABLE work_entries (
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
    impact_statement_source TEXT CHECK(
      impact_statement_source IS NULL OR impact_statement_source IN ('generated', 'user')
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
    work_area_id TEXT,
    excluded_from_exports INTEGER NOT NULL DEFAULT 0 CHECK(
      excluded_from_exports IN (0, 1)
    ),
    created_at TEXT NOT NULL CHECK(length(trim(created_at)) > 0),
    updated_at TEXT NOT NULL CHECK(length(trim(updated_at)) > 0),
    FOREIGN KEY (work_area_id)
      REFERENCES work_areas(id)
      ON DELETE SET NULL,
    CHECK (
      (impact_statement IS NULL AND impact_statement_source IS NULL)
      OR
      (impact_statement IS NOT NULL AND impact_statement_source IS NOT NULL)
    )
  );

  CREATE TABLE evidence (
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
      REFERENCES work_entries(id)
      ON DELETE CASCADE,
    UNIQUE (entry_id, type)
  );

  CREATE TABLE skills (
    id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
    slug TEXT NOT NULL UNIQUE CHECK(length(trim(slug)) > 0),
    name_key TEXT NOT NULL UNIQUE CHECK(length(trim(name_key)) > 0),
    category TEXT NOT NULL CHECK(category IN ('core', 'role_specific'))
  );

  INSERT INTO skills (id, slug, name_key, category) VALUES
    ('communication', 'communication', 'skill.communication', 'core'),
    ('collaboration', 'collaboration', 'skill.collaboration', 'core'),
    ('problem_solving', 'problem_solving', 'skill.problemSolving', 'core'),
    ('execution', 'execution', 'skill.execution', 'core'),
    ('attention_to_detail', 'attention_to_detail', 'skill.attentionToDetail', 'core'),
    ('customer_orientation', 'customer_orientation', 'skill.customerOrientation', 'core'),
    ('ownership', 'ownership', 'skill.ownership', 'core'),
    ('adaptability', 'adaptability', 'skill.adaptability', 'core'),
    ('leadership', 'leadership', 'skill.leadership', 'core'),
    ('role_expertise', 'role_expertise', 'skill.roleExpertise', 'role_specific');

  CREATE TABLE entry_skills (
    entry_id TEXT NOT NULL CHECK(length(trim(entry_id)) > 0),
    skill_id TEXT NOT NULL CHECK(length(trim(skill_id)) > 0),
    source TEXT NOT NULL CHECK(source IN ('rules', 'user')),
    PRIMARY KEY (entry_id, skill_id),
    FOREIGN KEY (entry_id)
      REFERENCES work_entries(id)
      ON DELETE CASCADE,
    FOREIGN KEY (skill_id)
      REFERENCES skills(id)
      ON DELETE RESTRICT
  );

  CREATE TABLE active_work_entry_draft (
    id INTEGER PRIMARY KEY NOT NULL CHECK(id = 1),
    step TEXT NOT NULL CHECK(step IN (
      'type',
      'event',
      'outcome',
      'evidence',
      'skills',
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
    selected_skills TEXT NOT NULL DEFAULT '[]',
    impact_statement TEXT NOT NULL DEFAULT '',
    impact_statement_source TEXT CHECK(
      impact_statement_source IS NULL OR impact_statement_source IN ('generated', 'user')
    ),
    work_area_id TEXT,
    updated_at TEXT NOT NULL CHECK(length(trim(updated_at)) > 0),
    FOREIGN KEY (work_area_id)
      REFERENCES work_areas(id)
      ON DELETE SET NULL
  );

  CREATE UNIQUE INDEX idx_work_areas_active_name_key
    ON work_areas(name_key)
    WHERE archived_at IS NULL;

  CREATE INDEX idx_work_areas_archived_name
    ON work_areas(archived_at, name COLLATE NOCASE);

  CREATE INDEX idx_work_entries_work_area_id
    ON work_entries(work_area_id, occurred_at DESC, created_at DESC, id DESC);

  CREATE INDEX idx_work_entries_history_order
    ON work_entries(occurred_at DESC, created_at DESC, id DESC);

  CREATE INDEX idx_evidence_entry_id_created_at
    ON evidence(entry_id, created_at ASC);

  CREATE INDEX idx_entry_skills_skill_id
    ON entry_skills(skill_id, entry_id);

  CREATE VIRTUAL TABLE work_entry_history_fts USING fts5(
    entry_id UNINDEXED,
    title,
    raw_note,
    impact_statement,
    evidence_text,
    tokenize = 'unicode61 remove_diacritics 2'
  );

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
`;

export async function migrateToVersion1(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(INITIAL_SCHEMA_SQL);
}
