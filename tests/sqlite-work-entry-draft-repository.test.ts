import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from '@/data/database';
import { SQLiteWorkEntryDraftRepository } from '@/data/repositories/SQLiteWorkEntryDraftRepository';
import type { WorkEntryDraft } from '@/domain/entry/draft';

jest.mock('@/data/database', () => ({ getDatabase: jest.fn() }));
const getDatabaseMock = jest.mocked(getDatabase);

const draft: WorkEntryDraft = {
  step: 'skills',
  intent: 'solved',
  rawNote: 'Fixed duplicate records before the report was submitted.',
  workAreaId: 'area-operations',
  outcomeType: 'error_fixed_or_prevented',
  evidenceTypes: ['number', 'deadline'],
  evidenceDetail: '7 duplicate records fixed before Friday.',
  skills: [
    { id: 'problem_solving', source: 'rules' },
    { id: 'attention_to_detail', source: 'user' },
  ],
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

  test('loads the encrypted active draft with skills and impact provenance', async () => {
    const db = createDatabase({
      step: 'skills',
      intent: 'solved',
      raw_note: draft.rawNote,
      work_area_id: draft.workAreaId,
      outcome_type: 'error_fixed_or_prevented',
      evidence_types: '["number","deadline"]',
      evidence_detail: draft.evidenceDetail,
      selected_skills:
        '[{"id":"problem_solving","source":"rules"},{"id":"attention_to_detail","source":"user"}]',
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
      work_area_id: draft.workAreaId,
      outcome_type: 'error_fixed_or_prevented',
      evidence_types: '["number","number"]',
      evidence_detail: draft.evidenceDetail,
      selected_skills: '[]',
      impact_statement: '',
      impact_statement_source: null,
    });
    getDatabaseMock.mockResolvedValue(db);
    await expect(
      new SQLiteWorkEntryDraftRepository().loadActive(),
    ).rejects.toThrow('Stored work entry draft evidence contains duplicates.');
  });

  test('rejects duplicate persisted skills', async () => {
    const db = createDatabase({
      step: 'skills',
      intent: 'solved',
      raw_note: draft.rawNote,
      work_area_id: draft.workAreaId,
      outcome_type: 'error_fixed_or_prevented',
      evidence_types: '[]',
      evidence_detail: '',
      selected_skills:
        '[{"id":"problem_solving","source":"rules"},{"id":"problem_solving","source":"user"}]',
      impact_statement: '',
      impact_statement_source: null,
    });
    getDatabaseMock.mockResolvedValue(db);
    await expect(
      new SQLiteWorkEntryDraftRepository().loadActive(),
    ).rejects.toThrow('Stored work entry draft skills contain duplicates.');
  });

  test('upserts skills and impact provenance with the active draft', async () => {
    const db = createDatabase();
    getDatabaseMock.mockResolvedValue(db);
    await new SQLiteWorkEntryDraftRepository().saveActive(draft);
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO active_work_entry_draft'),
      expect.objectContaining({
        $id: 1,
        $workAreaId: 'area-operations',
        $selectedSkills: JSON.stringify(draft.skills),
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
