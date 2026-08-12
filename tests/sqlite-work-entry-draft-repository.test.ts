import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from '@/data/database';
import { SQLiteWorkEntryDraftRepository } from '@/data/repositories/SQLiteWorkEntryDraftRepository';
import type { WorkEntryDraft } from '@/domain/entry/draft';

jest.mock('@/data/database', () => ({
  getDatabase: jest.fn(),
}));

const getDatabaseMock = jest.mocked(getDatabase);

const draft: WorkEntryDraft = {
  step: 'evidence',
  intent: 'solved',
  rawNote: 'Fixed duplicate records before the report was submitted.',
  outcomeType: 'error_fixed_or_prevented',
  evidenceTypes: ['number', 'deadline'],
  evidenceDetail: '7 duplicate records fixed before Friday.',
  impactStatement: '',
};

function createDatabase(row: unknown = null) {
  const db = {
    getFirstAsync: jest.fn().mockResolvedValue(row),
    runAsync: jest.fn().mockResolvedValue(undefined),
  };

  return db as unknown as SQLiteDatabase;
}

describe('SQLiteWorkEntryDraftRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('loads and validates the encrypted active draft', async () => {
    const db = createDatabase({
      step: 'evidence',
      intent: 'solved',
      raw_note: draft.rawNote,
      outcome_type: 'error_fixed_or_prevented',
      evidence_types: '["number","deadline"]',
      evidence_detail: draft.evidenceDetail,
      impact_statement: '',
    });
    getDatabaseMock.mockResolvedValue(db);

    const repository = new SQLiteWorkEntryDraftRepository();

    await expect(repository.loadActive()).resolves.toEqual(draft);
  });

  test('rejects malformed persisted evidence instead of silently restoring it', async () => {
    const db = createDatabase({
      step: 'evidence',
      intent: 'solved',
      raw_note: draft.rawNote,
      outcome_type: 'error_fixed_or_prevented',
      evidence_types: '["number","number"]',
      evidence_detail: draft.evidenceDetail,
      impact_statement: '',
    });
    getDatabaseMock.mockResolvedValue(db);

    const repository = new SQLiteWorkEntryDraftRepository();

    await expect(repository.loadActive()).rejects.toThrow(
      'Stored work entry draft evidence contains duplicates.',
    );
  });

  test('upserts the one active draft without exposing free-form data outside SQLite', async () => {
    const db = createDatabase();
    getDatabaseMock.mockResolvedValue(db);

    const repository = new SQLiteWorkEntryDraftRepository();
    await repository.saveActive(draft);

    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO active_work_entry_draft'),
      expect.objectContaining({
        $id: 1,
        $rawNote: draft.rawNote,
        $evidenceTypes: '["number","deadline"]',
      }),
    );
  });

  test('clears the active draft explicitly', async () => {
    const db = createDatabase();
    getDatabaseMock.mockResolvedValue(db);

    const repository = new SQLiteWorkEntryDraftRepository();
    await repository.clearActive();

    expect(db.runAsync).toHaveBeenCalledWith(
      'DELETE FROM active_work_entry_draft WHERE id = $id',
      { $id: 1 },
    );
  });
});
