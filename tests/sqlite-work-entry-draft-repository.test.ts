import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from '@/data/database';
import { SQLiteWorkEntryDraftRepository } from '@/data/repositories/SQLiteWorkEntryDraftRepository';
import type { WorkEntryDraft } from '@/domain/entry/draft';

jest.mock('@/data/database', () => ({ getDatabase: jest.fn() }));
const getDatabaseMock = jest.mocked(getDatabase);

const draft: WorkEntryDraft = {
  step: 'evidence',
  intent: 'solved',
  rawNote: 'Fixed duplicate records before the report was submitted.',
  outcomeType: 'error_fixed_or_prevented',
  evidenceTypes: ['number', 'deadline'],
  evidenceDetail: '7 duplicate records fixed before Friday.',
  impactStatement: '',
  impactStatementSource: null,
};

function createDatabase(row: unknown = null) {
  return {
    getFirstAsync: jest.fn().mockResolvedValue(row),
    runAsync: jest.fn().mockResolvedValue(undefined),
  } as unknown as SQLiteDatabase;
}

describe('SQLiteWorkEntryDraftRepository', () => {
  beforeEach(() => jest.clearAllMocks());

  test('loads the encrypted active draft with impact provenance', async () => {
    const db = createDatabase({
      step: 'evidence',
      intent: 'solved',
      raw_note: draft.rawNote,
      outcome_type: 'error_fixed_or_prevented',
      evidence_types: '["number","deadline"]',
      evidence_detail: draft.evidenceDetail,
      impact_statement: '',
      impact_statement_source: null,
    });
    getDatabaseMock.mockResolvedValue(db);
    await expect(
      new SQLiteWorkEntryDraftRepository().loadActive(),
    ).resolves.toEqual(draft);
  });

  test('rejects duplicate persisted evidence types', async () => {
    const db = createDatabase({
      step: 'evidence',
      intent: 'solved',
      raw_note: draft.rawNote,
      outcome_type: 'error_fixed_or_prevented',
      evidence_types: '["number","number"]',
      evidence_detail: draft.evidenceDetail,
      impact_statement: '',
      impact_statement_source: null,
    });
    getDatabaseMock.mockResolvedValue(db);
    await expect(
      new SQLiteWorkEntryDraftRepository().loadActive(),
    ).rejects.toThrow('Stored work entry draft evidence contains duplicates.');
  });

  test('upserts impact provenance with the active draft', async () => {
    const db = createDatabase();
    getDatabaseMock.mockResolvedValue(db);
    await new SQLiteWorkEntryDraftRepository().saveActive(draft);
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO active_work_entry_draft'),
      expect.objectContaining({
        $id: 1,
        $impactStatementSource: null,
      }),
    );
  });

  test('clears the active draft explicitly', async () => {
    const db = createDatabase();
    getDatabaseMock.mockResolvedValue(db);
    await new SQLiteWorkEntryDraftRepository().clearActive();
    expect(db.runAsync).toHaveBeenCalledWith(
      'DELETE FROM active_work_entry_draft WHERE id = $id',
      { $id: 1 },
    );
  });
});
