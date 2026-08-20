import * as Crypto from 'expo-crypto';
import { getDatabase } from '@/data/database';
import { SQLiteWorkEntryRepository } from '@/data/repositories/SQLiteWorkEntryRepository';
import type { CreateWorkEntry, UpdateWorkEntry } from '@/domain/entry/model';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(),
}));

jest.mock('@/data/database', () => ({
  getDatabase: jest.fn(),
}));

const getDatabaseMock = jest.mocked(getDatabase);
const randomUUIDMock = jest.mocked(Crypto.randomUUID);

const baseRow = {
  id: 'entry-1',
  type: 'contribution',
  title: 'Helped Finance',
  raw_note: 'Helped Finance reconcile the monthly report.',
  impact_statement: 'Helped Finance reconcile the monthly report.',
  impact_statement_source: 'generated',
  occurred_at: '2026-08-10T08:00:00.000Z',
  outcome_type: 'person_helped',
  status: 'review_ready',
  excluded_from_exports: 0,
  created_at: '2026-08-10T08:01:00.000Z',
  updated_at: '2026-08-10T08:01:00.000Z',
  evidence_type: 'deadline',
  evidence_text_value: 'Completed before Friday close',
};

function useRows(rows: unknown[], skillRows?: unknown[]) {
  const getAllAsync = jest.fn().mockResolvedValueOnce(rows);
  if (skillRows) {
    getAllAsync.mockResolvedValueOnce(skillRows);
  }

  getDatabaseMock.mockResolvedValue({
    getAllAsync,
  } as unknown as Awaited<ReturnType<typeof getDatabase>>);

  return getAllAsync;
}

function useCount(count: number) {
  const getFirstAsync = jest.fn().mockResolvedValue({ count });

  getDatabaseMock.mockResolvedValue({
    getFirstAsync,
  } as unknown as Awaited<ReturnType<typeof getDatabase>>);

  return getFirstAsync;
}

function useTransaction(options?: {
  entryRows?: unknown[];
  skillRows?: unknown[];
}) {
  const getAllAsync = jest
    .fn()
    .mockResolvedValueOnce(options?.entryRows ?? [])
    .mockResolvedValueOnce(options?.skillRows ?? []);
  const db = {
    getAllAsync,
    runAsync: jest.fn().mockResolvedValue({
      changes: 1,
      lastInsertRowId: 0,
    }),
    withTransactionAsync: jest.fn(async (operation: () => Promise<void>) => {
      await operation();
    }),
  };

  getDatabaseMock.mockResolvedValue(
    db as unknown as Awaited<ReturnType<typeof getDatabase>>,
  );

  return {
    db,
    getAllAsync,
    withTransactionAsync: db.withTransactionAsync,
  };
}

describe('SQLiteWorkEntryRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('findById binds the id and reconstructs joined evidence and skills', async () => {
    const getAllAsync = useRows(
      [
        baseRow,
        {
          ...baseRow,
          evidence_type: 'result',
        },
      ],
      [
        { skill_id: 'problem_solving', source: 'rules' },
        { skill_id: 'attention_to_detail', source: 'user' },
      ],
    );
    const repository = new SQLiteWorkEntryRepository();
    const id = "entry-with-'quotes'-and-spaces";

    const entry = await repository.findById(id);

    expect(getAllAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE work_entries.id = $id'),
      { $id: id },
    );
    expect(getAllAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('FROM entry_skills'),
      { $id: id },
    );
    expect(entry).toEqual({
      id: 'entry-1',
      type: 'contribution',
      title: 'Helped Finance',
      rawNote: 'Helped Finance reconcile the monthly report.',
      impactStatement: 'Helped Finance reconcile the monthly report.',
      impactStatementSource: 'generated',
      occurredAt: '2026-08-10T08:00:00.000Z',
      outcomeType: 'person_helped',
      status: 'review_ready',
      evidence: {
        types: ['deadline', 'result'],
        detail: 'Completed before Friday close',
      },
      skills: [
        { id: 'problem_solving', source: 'rules' },
        { id: 'attention_to_detail', source: 'user' },
      ],
      excludedFromExports: false,
      createdAt: '2026-08-10T08:01:00.000Z',
      updatedAt: '2026-08-10T08:01:00.000Z',
    });
  });

  test('findById returns null without querying skills when the entry is missing', async () => {
    const getAllAsync = useRows([]);
    const repository = new SQLiteWorkEntryRepository();

    await expect(repository.findById('missing')).resolves.toBeNull();
    expect(getAllAsync).toHaveBeenCalledTimes(1);
  });

  test('findRecent binds the limit after limiting work entries before the join', async () => {
    const getAllAsync = useRows([
      baseRow,
      {
        ...baseRow,
        id: 'entry-2',
        title: 'Fixed an issue',
        raw_note: 'Fixed an issue in the report flow.',
        occurred_at: '2026-08-09T08:00:00.000Z',
        created_at: '2026-08-09T08:01:00.000Z',
        updated_at: '2026-08-09T08:01:00.000Z',
        type: 'problem_solved',
        outcome_type: 'error_fixed_or_prevented',
        evidence_type: null,
        evidence_text_value: null,
      },
    ]);
    const repository = new SQLiteWorkEntryRepository();

    const entries = await repository.findRecent(2);

    expect(getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT $limit'),
      { $limit: 2 },
    );
    expect(entries).toHaveLength(2);
    expect(entries[0]?.id).toBe('entry-1');
    expect(entries[1]).toMatchObject({
      id: 'entry-2',
      type: 'problem_solved',
      evidence: null,
    });
  });

  test('findRecent rejects invalid limits without opening the database', async () => {
    const repository = new SQLiteWorkEntryRepository();

    await expect(repository.findRecent(-1)).rejects.toThrow(
      'Recent work entry limit must be a non-negative integer.',
    );
    await expect(repository.findRecent(1.5)).rejects.toThrow(
      'Recent work entry limit must be a non-negative integer.',
    );
    await expect(repository.findRecent(0)).resolves.toEqual([]);

    expect(getDatabaseMock).not.toHaveBeenCalled();
  });

  test('countSince binds a validated ISO timestamp', async () => {
    const getFirstAsync = useCount(4);
    const repository = new SQLiteWorkEntryRepository();
    const boundary = '2026-08-10T17:00:00.000Z';

    await expect(repository.countSince(boundary)).resolves.toBe(4);

    expect(getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE occurred_at >= $occurredAtInclusive'),
      { $occurredAtInclusive: boundary },
    );
  });

  test('countSince rejects invalid boundaries without opening the database', async () => {
    const repository = new SQLiteWorkEntryRepository();

    await expect(repository.countSince('not-a-date')).rejects.toThrow(
      'Work entry count boundary must be an ISO timestamp.',
    );
    expect(getDatabaseMock).not.toHaveBeenCalled();
  });

  test('commit writes entry, evidence, and skills and consumes the active draft atomically', async () => {
    const { db, withTransactionAsync } = useTransaction();
    randomUUIDMock
      .mockReturnValueOnce('entry-created')
      .mockReturnValueOnce('evidence-deadline')
      .mockReturnValueOnce('evidence-result');
    const repository = new SQLiteWorkEntryRepository();
    const input: CreateWorkEntry = {
      type: 'contribution',
      title: 'Helped Finance',
      rawNote: 'Helped Finance reconcile the monthly report.',
      impactStatement: 'Helped Finance reconcile the monthly report.',
      impactStatementSource: 'generated',
      occurredAt: '2026-08-10T08:00:00.000Z',
      outcomeType: 'person_helped',
      status: 'review_ready',
      evidence: {
        types: ['deadline', 'result'],
        detail: 'Completed before Friday close',
      },
      skills: [{ id: 'collaboration', source: 'rules' }],
      excludedFromExports: false,
    };

    const entry = await repository.commit(input);

    expect(withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(db.runAsync).toHaveBeenCalledTimes(5);
    expect(db.runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO work_entries'),
      expect.objectContaining({
        $id: 'entry-created',
        $rawNote: input.rawNote,
        $impactStatementSource: 'generated',
        $excludedFromExports: 0,
      }),
    );
    expect(db.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO evidence'),
      expect.objectContaining({
        $id: 'evidence-deadline',
        $entryId: 'entry-created',
        $type: 'deadline',
        $textValue: input.evidence?.detail,
      }),
    );
    expect(db.runAsync).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO evidence'),
      expect.objectContaining({
        $id: 'evidence-result',
        $entryId: 'entry-created',
        $type: 'result',
        $textValue: input.evidence?.detail,
      }),
    );
    expect(db.runAsync).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('INSERT INTO entry_skills'),
      {
        $entryId: 'entry-created',
        $skillId: 'collaboration',
        $source: 'rules',
      },
    );
    expect(db.runAsync).toHaveBeenNthCalledWith(
      5,
      'DELETE FROM active_work_entry_draft WHERE id = $activeDraftId',
      { $activeDraftId: 1 },
    );
    expect(entry).toEqual({
      id: 'entry-created',
      type: input.type,
      title: input.title,
      rawNote: input.rawNote,
      impactStatement: input.impactStatement,
      occurredAt: input.occurredAt,
      outcomeType: input.outcomeType,
      status: input.status,
      evidence: input.evidence,
      excludedFromExports: input.excludedFromExports,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(entry.updatedAt).toBe(entry.createdAt);
  });

  test('update replaces mutable entry data, evidence, and skills in one transaction', async () => {
    const { db, withTransactionAsync } = useTransaction({
      entryRows: [
        {
          ...baseRow,
          type: 'problem_solved',
          title: 'Resolved reconciliation mismatch',
          raw_note: 'Resolved reconciliation mismatch.',
          impact_statement: 'Corrected the mismatch before submission.',
          impact_statement_source: 'user',
          outcome_type: 'error_fixed_or_prevented',
          evidence_type: 'number',
          evidence_text_value: '7 duplicate rows removed',
        },
      ],
      skillRows: [{ skill_id: 'problem_solving', source: 'rules' }],
    });
    randomUUIDMock.mockReturnValueOnce('updated-evidence');
    const repository = new SQLiteWorkEntryRepository();
    const input: UpdateWorkEntry = {
      type: 'problem_solved',
      title: 'Resolved reconciliation mismatch',
      rawNote: 'Resolved reconciliation mismatch.',
      impactStatement: 'Corrected the mismatch before submission.',
      impactStatementSource: 'user',
      occurredAt: '2026-08-10T08:00:00.000Z',
      outcomeType: 'error_fixed_or_prevented',
      status: 'review_ready',
      evidence: {
        types: ['number'],
        detail: '7 duplicate rows removed',
      },
      skills: [{ id: 'problem_solving', source: 'rules' }],
      excludedFromExports: false,
    };

    const updated = await repository.update('entry-1', input);

    expect(withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(db.runAsync).toHaveBeenCalledTimes(5);
    expect(db.runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('UPDATE work_entries'),
      expect.objectContaining({
        $id: 'entry-1',
        $rawNote: input.rawNote,
        $impactStatementSource: 'user',
        $status: 'review_ready',
      }),
    );
    expect(db.runAsync).toHaveBeenNthCalledWith(
      2,
      'DELETE FROM evidence WHERE entry_id = $id',
      { $id: 'entry-1' },
    );
    expect(db.runAsync).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO evidence'),
      expect.objectContaining({
        $id: 'updated-evidence',
        $entryId: 'entry-1',
        $type: 'number',
      }),
    );
    expect(db.runAsync).toHaveBeenNthCalledWith(
      4,
      'DELETE FROM entry_skills WHERE entry_id = $id',
      { $id: 'entry-1' },
    );
    expect(db.runAsync).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('INSERT INTO entry_skills'),
      {
        $entryId: 'entry-1',
        $skillId: 'problem_solving',
        $source: 'rules',
      },
    );
    expect(updated.skills).toEqual([
      { id: 'problem_solving', source: 'rules' },
    ]);
  });

  test('rejects invalid persisted domain values', async () => {
    useRows([
      {
        ...baseRow,
        type: 'not-a-real-entry-type',
      },
    ]);
    const repository = new SQLiteWorkEntryRepository();

    await expect(repository.findById('entry-1')).rejects.toThrow(
      'Stored work entry type is invalid.',
    );
  });

  test('rejects inconsistent evidence details for the same entry', async () => {
    useRows([
      baseRow,
      {
        ...baseRow,
        evidence_type: 'result',
        evidence_text_value: 'A different detail',
      },
    ]);
    const repository = new SQLiteWorkEntryRepository();

    await expect(repository.findById('entry-1')).rejects.toThrow(
      'Stored evidence for work entry entry-1 is inconsistent.',
    );
  });
});
